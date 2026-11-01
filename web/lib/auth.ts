"use client";

const TOKEN_KEY = "zoa_auth";
/** Refresh id token this many ms before hard expiry */
const REFRESH_SKEW_MS = 60_000;

export interface AuthSession {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  email: string;
  name?: string;
  expiresAt: number;
  groups: string[];
  isAdmin: boolean;
  role: "admin" | "user";
}

function isBrowser() {
  return typeof window !== "undefined";
}

/** Stable client snapshot for useSyncExternalStore */
let snapshot: AuthSession | null = null;
let snapshotRaw: string | null = null;
const sessionListeners = new Set<() => void>();

function readRaw(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function syncSnapshotFromStorage() {
  const raw = readRaw();
  if (raw === snapshotRaw) return;
  snapshotRaw = raw;
  if (!raw) {
    snapshot = null;
    return;
  }
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    // Backfill role fields for sessions saved before roles existed
    if (parsed.groups === undefined) {
      const groups = groupsFromTokens(
        parsed.idToken ?? "",
        parsed.accessToken ?? "",
      );
      parsed.groups = groups;
      parsed.isAdmin = groups.includes("admin");
      parsed.role = parsed.isAdmin ? "admin" : "user";
    }
    snapshot = parsed;
  } catch {
    snapshot = null;
    snapshotRaw = null;
  }
}

export function getSession(): AuthSession | null {
  syncSnapshotFromStorage();
  return snapshot;
}

export function saveSession(session: AuthSession) {
  if (!isBrowser()) return;
  const raw = JSON.stringify(session);
  localStorage.setItem(TOKEN_KEY, raw);
  snapshotRaw = raw;
  snapshot = session;
  notifySessionListeners();
}

export function clearSession() {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  snapshotRaw = null;
  snapshot = null;
  notifySessionListeners();
}

/**
 * Clear credentials and send the user to login when the session
 * cannot be recovered (expired id token + failed/missing refresh).
 */
export function forceLogout(
  reason: "session_expired" | "signed_out" = "session_expired",
) {
  clearSession();
  if (!isBrowser()) return;

  const path = window.location.pathname;
  if (path.startsWith("/login") || path.startsWith("/signup")) return;

  const params = new URLSearchParams({ reason });
  window.location.replace(`/login?${params.toString()}`);
}

export function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

function notifySessionListeners() {
  sessionListeners.forEach((l) => l());
}

const poolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "";
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "";
const region =
  process.env.NEXT_PUBLIC_AWS_REGION ?? poolId.split("_")[0] ?? "us-east-1";

export function isCognitoConfigured() {
  return Boolean(poolId && clientId);
}

/** UAT / local: password reset emails via Mailpit (see MOCK_AUTH_EMAIL). */
export function isMockAuthEmailEnabled() {
  return process.env.NEXT_PUBLIC_MOCK_AUTH_EMAIL === "true";
}

async function mockAuthPost(path: string, body: Record<string, string>) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { error?: string; ok?: boolean };
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data;
}

export class UserNotConfirmedError extends Error {
  readonly email: string;

  constructor(email: string) {
    super(
      "Your email is not confirmed yet. Enter the code we sent you, or resend a new code.",
    );
    this.name = "UserNotConfirmedError";
    this.email = email;
  }
}

function usernameFromCognitoBody(body: Record<string, unknown>): string {
  if (typeof body.Username === "string") return body.Username;
  const params = body.AuthParameters;
  if (params && typeof params === "object" && "USERNAME" in params) {
    const username = (params as { USERNAME?: unknown }).USERNAME;
    if (typeof username === "string") return username;
  }
  return "";
}

async function cognitoRequest(
  target: string,
  body: Record<string, unknown>,
) {
  const res = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const type = typeof data.__type === "string" ? data.__type : "";
    if (type.includes("UserNotConfirmedException")) {
      throw new UserNotConfirmedError(usernameFromCognitoBody(body));
    }
    const msg =
      typeof data.message === "string"
        ? data.message
        : type || "Cognito request failed";
    throw new Error(msg);
  }
  return data;
}

function parseJwtPayload(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as {
      email?: string;
      name?: string;
      given_name?: string;
      exp?: number;
      "cognito:groups"?: string[] | string;
    };
    return payload;
  } catch {
    return {};
  }
}

function groupsFromTokens(idToken: string, accessToken: string): string[] {
  const from = (token: string) => {
    const raw = parseJwtPayload(token)["cognito:groups"];
    if (Array.isArray(raw)) return raw.filter((g) => typeof g === "string");
    if (typeof raw === "string") return [raw];
    return [] as string[];
  };
  const groups = [...from(idToken), ...from(accessToken)];
  return [...new Set(groups)];
}

function sessionFromAuthResult(
  result: {
    IdToken: string;
    AccessToken: string;
    RefreshToken?: string;
    ExpiresIn: number;
  },
  previous?: AuthSession | null,
  emailFallback?: string,
): AuthSession {
  const claims = parseJwtPayload(result.IdToken);
  const expMs =
    typeof claims.exp === "number"
      ? claims.exp * 1000
      : Date.now() + result.ExpiresIn * 1000;

  const groups = groupsFromTokens(result.IdToken, result.AccessToken);
  const isAdmin = groups.includes("admin");

  return {
    idToken: result.IdToken,
    accessToken: result.AccessToken,
    refreshToken: result.RefreshToken ?? previous?.refreshToken,
    email: claims.email ?? previous?.email ?? emailFallback ?? "",
    name: claims.name ?? claims.given_name ?? previous?.name,
    expiresAt: expMs,
    groups,
    isAdmin,
    role: isAdmin ? "admin" : "user",
  };
}

function isTokenFresh(session: AuthSession) {
  return session.expiresAt - REFRESH_SKEW_MS > Date.now();
}

let refreshInFlight: Promise<AuthSession | null> | null = null;

/**
 * Exchange refresh token for new id/access tokens (single-flight).
 * On terminal failure, clears the session and logs the user out.
 */
export async function refreshSession(options?: {
  /** When false, only clear storage — no redirect (rare). Default true. */
  redirectOnFailure?: boolean;
}): Promise<AuthSession | null> {
  const redirectOnFailure = options?.redirectOnFailure !== false;

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const fail = (): null => {
      if (redirectOnFailure) forceLogout("session_expired");
      else clearSession();
      return null;
    };

    const current = getSession();
    if (!current?.refreshToken) {
      return fail();
    }

    if (!isCognitoConfigured()) {
      const extended: AuthSession = {
        ...current,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        groups: current.groups ?? (current.isAdmin ? ["admin"] : ["user"]),
        isAdmin: Boolean(current.isAdmin),
        role: current.isAdmin ? "admin" : "user",
      };
      saveSession(extended);
      return extended;
    }

    try {
      const data = await cognitoRequest("InitiateAuth", {
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: clientId,
        AuthParameters: {
          REFRESH_TOKEN: current.refreshToken,
        },
      });

      const result = data.AuthenticationResult as
        | {
            IdToken: string;
            AccessToken: string;
            RefreshToken?: string;
            ExpiresIn: number;
          }
        | undefined;

      if (!result?.IdToken) {
        return fail();
      }

      const next = sessionFromAuthResult(result, current);
      saveSession(next);
      return next;
    } catch {
      return fail();
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

/**
 * Return a session with a non-expired id token, refreshing if needed.
 * Logs out when the id token is stale and refresh is impossible.
 */
export async function ensureFreshSession(): Promise<AuthSession | null> {
  const current = getSession();
  if (!current?.idToken) return null;

  if (
    current.idToken === "dev-token" ||
    current.idToken === "dev-admin-token" ||
    isTokenFresh(current)
  ) {
    return current;
  }

  if (!current.refreshToken) {
    forceLogout("session_expired");
    return null;
  }

  return refreshSession();
}

export async function signUp(input: {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
}) {
  if (!isCognitoConfigured()) {
    if (isMockAuthEmailEnabled()) {
      await mockAuthPost("/api/auth/mock/register", {
        email: input.email,
        password: input.password,
      });
    }
    saveSession({
      idToken: "dev-token",
      accessToken: "dev-token",
      email: input.email,
      name: `${input.givenName} ${input.familyName}`.trim(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      groups: ["user"],
      isAdmin: false,
      role: "user",
    });
    return { needsConfirmation: false };
  }

  await cognitoRequest("SignUp", {
    ClientId: clientId,
    Username: input.email,
    Password: input.password,
    UserAttributes: [
      { Name: "email", Value: input.email },
      { Name: "given_name", Value: input.givenName },
      { Name: "family_name", Value: input.familyName },
    ],
  });

  return { needsConfirmation: true };
}

export async function confirmSignUp(email: string, code: string) {
  if (!isCognitoConfigured()) return;
  await cognitoRequest("ConfirmSignUp", {
    ClientId: clientId,
    Username: email,
    ConfirmationCode: code,
  });
}

export async function resendConfirmationCode(email: string) {
  if (!isCognitoConfigured()) {
    throw new Error("Email confirmation is not required in local mock mode");
  }
  await cognitoRequest("ResendConfirmationCode", {
    ClientId: clientId,
    Username: email,
  });
}

export async function signIn(email: string, password: string) {
  if (!isCognitoConfigured()) {
    // Prefix admin@ or use password "admin" locally → admin mock
    const isAdmin =
      email.toLowerCase().startsWith("admin") || password === "admin";

    if (isMockAuthEmailEnabled() && !isAdmin) {
      const res = await fetch("/api/auth/mock/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (!data.ok) {
        throw new Error("Incorrect email or password");
      }
    }

    saveSession({
      idToken: isAdmin ? "dev-admin-token" : "dev-token",
      accessToken: isAdmin ? "dev-admin-token" : "dev-token",
      email,
      name: email.split("@")[0],
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      groups: isAdmin ? ["admin", "user"] : ["user"],
      isAdmin,
      role: isAdmin ? "admin" : "user",
    });
    return getSession()!;
  }

  const data = await cognitoRequest("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const result = data.AuthenticationResult as
    | {
        IdToken: string;
        AccessToken: string;
        RefreshToken?: string;
        ExpiresIn: number;
      }
    | undefined;

  if (!result) {
    throw new Error("Authentication did not return tokens");
  }

  const session = sessionFromAuthResult(result, null, email);
  saveSession(session);
  return session;
}

export function signOut() {
  clearSession();
}

export async function forgotPassword(email: string) {
  if (!isCognitoConfigured()) {
    if (!isMockAuthEmailEnabled()) {
      throw new Error("Password reset is not available in local mock mode");
    }
    await mockAuthPost("/api/auth/mock/forgot-password", { email });
    return;
  }

  await cognitoRequest("ForgotPassword", {
    ClientId: clientId,
    Username: email,
  });
}

export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string,
) {
  if (!isCognitoConfigured()) {
    if (!isMockAuthEmailEnabled()) {
      throw new Error("Password reset is not available in local mock mode");
    }
    await mockAuthPost("/api/auth/mock/confirm-forgot-password", {
      email,
      code,
      password: newPassword,
    });
    return;
  }

  await cognitoRequest("ConfirmForgotPassword", {
    ClientId: clientId,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });
}
