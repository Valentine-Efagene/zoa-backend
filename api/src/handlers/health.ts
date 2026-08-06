import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ok } from "../lib/response";

export const handler: APIGatewayProxyHandlerV2 = async () => {
  return ok({
    status: "ok",
    service: "zoa-api",
    stage: process.env.STAGE ?? "dev",
    timestamp: new Date().toISOString(),
  });
};
