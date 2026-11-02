import { timingSafeEqual } from "crypto";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

export const SWAGGER_DOCS_REALM = "Z.O.A API docs";

export const SWAGGER_DOCS_MISCONFIGURED_MESSAGE =
  "Swagger UI is unavailable: set SWAGGER_USER and SWAGGER_PASSWORD on this API " +
  "(GitHub repo secrets for deploy, or local api/.env for offline), then redeploy.";

export const SWAGGER_DOCS_PLACEHOLDER_MESSAGE =
  "Swagger UI is unavailable: SWAGGER_USER and SWAGGER_PASSWORD are still placeholder values " +
  "(REPLACE_ME). Update secrets and redeploy.";

function isPlaceholder(value: string): boolean {
  return value.toLowerCase() === "replace_me";
}

function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function parseBasicAuthHeader(
  header: string,
): { username: string; password: string } | null {
  if (!header.startsWith("Basic ")) {
    return null;
  }
  const encoded = header.slice(6).trim();
  if (!encoded) {
    return null;
  }
  let decoded: string;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 0) {
    return null;
  }
  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  };
}

export type SwaggerDocsCredentials =
  | { ok: true; user: string; pass: string }
  | { ok: false; message: string };

export function resolveSwaggerDocsCredentials(
  username: string | undefined,
  password: string | undefined,
): SwaggerDocsCredentials {
  const user = username?.trim();
  const pass = password?.trim();
  if (!user || !pass) {
    return { ok: false, message: SWAGGER_DOCS_MISCONFIGURED_MESSAGE };
  }
  if (isPlaceholder(user) || isPlaceholder(pass)) {
    return { ok: false, message: SWAGGER_DOCS_PLACEHOLDER_MESSAGE };
  }
  return { ok: true, user, pass };
}

export type SwaggerDocsAuthFailure = {
  ok: false;
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

export type SwaggerDocsAuthResult = { ok: true } | SwaggerDocsAuthFailure;

function unauthorizedResponse(): SwaggerDocsAuthFailure {
  return {
    ok: false,
    statusCode: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${SWAGGER_DOCS_REALM}"`,
      "Content-Type": "text/plain; charset=utf-8",
    },
    body: "Authentication required",
  };
}

function misconfiguredResponse(message: string): SwaggerDocsAuthFailure {
  return {
    ok: false,
    statusCode: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: message,
  };
}

export function assertSwaggerDocsBasicAuth(
  event: Pick<APIGatewayProxyEventV2, "headers">,
  username: string | undefined = process.env.SWAGGER_USER,
  password: string | undefined = process.env.SWAGGER_PASSWORD,
): SwaggerDocsAuthResult {
  const credentials = resolveSwaggerDocsCredentials(username, password);
  if (!credentials.ok) {
    return misconfiguredResponse(credentials.message);
  }

  const headers = event.headers ?? {};
  const header = headers.authorization ?? headers.Authorization;
  if (!header) {
    return unauthorizedResponse();
  }

  const provided = parseBasicAuthHeader(header);
  if (
    !provided ||
    !safeEqualString(provided.username, credentials.user) ||
    !safeEqualString(provided.password, credentials.pass)
  ) {
    return unauthorizedResponse();
  }

  return { ok: true };
}

export function swaggerDocsAuthFailureToResponse(
  failure: SwaggerDocsAuthFailure,
): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  return {
    statusCode: failure.statusCode,
    headers: failure.headers,
    body: failure.body,
  };
}
