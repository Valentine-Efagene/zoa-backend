import { createRemoteJWKSet, errors, jwtVerify } from "jose";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

export type UserRole = "admin" | "user";

export interface AuthUser {
  sub: string;
  email?: string;
  name?: string;
  groups: string[];
  isAdmin: boolean;
  role: UserRole;
}

const userPoolId = process.env.COGNITO_USER_POOL_ID ?? "";
const clientId = process.env.COGNITO_CLIENT_ID ?? "";
const region =
  process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "us-east-1";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!userPoolId) {
    throw new Error("COGNITO_USER_POOL_ID is not configured");
  }
  if (!jwks) {
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  }
  return jwks;
}

function groupsFromPayload(payload: Record<string, unknown>): string[] {
  const raw = payload["cognito:groups"];
  if (Array.isArray(raw)) {
    return raw.filter((g): g is string => typeof g === "string");
  }
  if (typeof raw === "string") return [raw];
  return [];
}

function toAuthUser(
  sub: string,
  groups: string[],
  email?: string,
  name?: string,
): AuthUser {
  const isAdmin = groups.includes("admin");
  return {
    sub,
    email,
    name,
    groups,
    isAdmin,
    role: isAdmin ? "admin" : "user",
  };
}

export async function requireAuth(
  event: APIGatewayProxyEventV2,
): Promise<AuthUser> {
  const header =
    event.headers.authorization ?? event.headers.Authorization ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new AuthError("Missing bearer token");
  }

  // Local/dev bypass when Cognito is not wired yet
  if (!userPoolId && process.env.STAGE !== "prod") {
    const groups =
      process.env.DEV_ADMIN === "true" ? ["admin", "user"] : ["user"];
    return toAuthUser("dev-user", groups, "dev@zoa.local", "Dev User");
  }

  if (match[1] === "dev-token" && process.env.STAGE !== "prod") {
    const groups =
      process.env.DEV_ADMIN === "true" ? ["admin", "user"] : ["user"];
    return toAuthUser("dev-user", groups, "dev@zoa.local", "Dev User");
  }

  // Explicit local admin mock token
  if (match[1] === "dev-admin-token" && process.env.STAGE !== "prod") {
    return toAuthUser(
      "dev-admin",
      ["admin", "user"],
      "admin@zoa.local",
      "Dev Admin",
    );
  }

  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

  try {
    const { payload } = await jwtVerify(match[1], getJwks(), {
      issuer,
      audience: clientId || undefined,
      clockTolerance: 30,
    });

    const groups = groupsFromPayload(payload as Record<string, unknown>);
    return toAuthUser(
      String(payload.sub),
      groups,
      typeof payload.email === "string" ? payload.email : undefined,
      typeof payload.name === "string"
        ? payload.name
        : typeof payload.given_name === "string"
          ? payload.given_name
          : undefined,
    );
  } catch (err) {
    if (err instanceof errors.JWTExpired) {
      throw new AuthError("Session expired. Please sign in again.");
    }
    if (err instanceof errors.JOSEError) {
      throw new AuthError("Invalid authentication token");
    }
    throw err;
  }
}

export async function requireAdmin(
  event: APIGatewayProxyEventV2,
): Promise<AuthUser> {
  const user = await requireAuth(event);
  if (!user.isAdmin) {
    throw new ForbiddenError("Admin access required");
  }
  return user;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}
