import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

const corsOrigin = process.env.CORS_ORIGIN ?? "*";

export const corsHeaders = {
  "Access-Control-Allow-Origin": corsOrigin,
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

export function json(
  statusCode: number,
  body: unknown,
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
    body: JSON.stringify(body),
  };
}

export function ok(body: unknown) {
  return json(200, body);
}

export function created(body: unknown) {
  return json(201, body);
}

export function badRequest(message: string, details?: unknown) {
  return json(400, { error: message, details });
}

export function unauthorized(message = "Unauthorized") {
  return json(401, { error: message });
}

export function notFound(message = "Not found") {
  return json(404, { error: message });
}

export function serverError(message = "Internal server error") {
  return json(500, { error: message });
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
