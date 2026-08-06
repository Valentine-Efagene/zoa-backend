import { createRemoteJWKSet, jwtVerify } from "jose";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

export interface AuthUser {
  sub: string;
  email?: string;
  name?: string;
}

const userPoolId = process.env.COGNITO_USER_POOL_ID ?? "";
const clientId = process.env.COGNITO_CLIENT_ID ?? "";
const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "us-east-1";

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
    return {
      sub: "dev-user",
      email: "dev@zoa.local",
      name: "Dev User",
    };
  }

  if (match[1] === "dev-token" && process.env.STAGE !== "prod") {
    return {
      sub: "dev-user",
      email: "dev@zoa.local",
      name: "Dev User",
    };
  }

  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  const { payload } = await jwtVerify(match[1], getJwks(), {
    issuer,
    audience: clientId || undefined,
  });

  return {
    sub: String(payload.sub),
    email: typeof payload.email === "string" ? payload.email : undefined,
    name:
      typeof payload.name === "string"
        ? payload.name
        : typeof payload.given_name === "string"
          ? payload.given_name
          : undefined,
  };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
