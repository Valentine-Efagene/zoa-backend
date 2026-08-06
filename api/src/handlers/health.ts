import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ok, originFromEvent } from "../lib/response";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  return ok(
    {
      status: "ok",
      service: "zoa-api",
      stage: process.env.STAGE ?? "dev",
      timestamp: new Date().toISOString(),
    },
    originFromEvent(event),
  );
};
