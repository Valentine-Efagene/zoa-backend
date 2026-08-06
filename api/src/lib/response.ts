import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

/**
 * Comma-separated list of allowed origins, or `*`.
 * Example: `http://localhost:3000,http://localhost:3003,https://app.example.com`
 */
const configured = (process.env.CORS_ORIGIN ?? "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowAll = configured.includes("*") || configured.length === 0;

export function originFromEvent(
  event: Pick<APIGatewayProxyEventV2, "headers">,
): string | undefined {
  const headers = event.headers ?? {};
  return headers.origin ?? headers.Origin;
}

export function corsHeaders(requestOrigin?: string | null) {
  let allowOrigin: string | undefined;

  if (allowAll) {
    allowOrigin = requestOrigin ?? "*";
  } else if (requestOrigin && configured.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
  }

  return {
    ...(allowOrigin
      ? { "Access-Control-Allow-Origin": allowOrigin }
      : {}),
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": allowOrigin !== "*" ? "true" : "false",
    Vary: "Origin",
  };
}

export function json(
  statusCode: number,
  body: unknown,
  requestOrigin?: string | null,
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(requestOrigin),
    },
    body: JSON.stringify(body),
  };
}

export function ok(body: unknown, requestOrigin?: string | null) {
  return json(200, body, requestOrigin);
}

export function created(body: unknown, requestOrigin?: string | null) {
  return json(201, body, requestOrigin);
}

export function badRequest(
  message: string,
  details?: unknown,
  requestOrigin?: string | null,
) {
  return json(400, { error: message, details }, requestOrigin);
}

export function unauthorized(
  message = "Unauthorized",
  requestOrigin?: string | null,
) {
  return json(401, { error: message }, requestOrigin);
}

export function forbidden(
  message = "Forbidden",
  requestOrigin?: string | null,
) {
  return json(403, { error: message }, requestOrigin);
}

export function notFound(message = "Not found", requestOrigin?: string | null) {
  return json(404, { error: message }, requestOrigin);
}

export function serverError(
  message = "Internal server error",
  requestOrigin?: string | null,
) {
  return json(500, { error: message }, requestOrigin);
}

export function parseBody<T = unknown>(
  event: APIGatewayProxyEventV2,
): T | null {
  if (!event.body) return null;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
