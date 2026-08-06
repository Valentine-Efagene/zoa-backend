import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { AuthError, requireAuth } from "../lib/auth";
import { APPLICATIONS_TABLE, docClient } from "../lib/aws";
import {
  applicationSk,
  userPk,
  workflowGsi1pk,
  type Application,
  type ApplicationStatus,
  type FormData,
  type WorkflowSlug,
} from "../lib/types";
import { getWorkflow } from "../lib/workflows";
import {
  badRequest,
  created,
  notFound,
  ok,
  originFromEvent,
  parseBody,
  serverError,
  unauthorized,
} from "../lib/response";

const createSchema = z.object({
  workflowSlug: z.enum([
    "company-limited-by-shares",
    "company-limited-by-guarantee",
    "incorporated-trustees",
    "scuml-registration",
  ]),
  formData: z.record(z.unknown()).default({}),
});

const updateSchema = z.object({
  formData: z.record(z.unknown()).optional(),
  status: z
    .enum([
      "draft",
      "submitted",
      "in_review",
      "needs_info",
      "completed",
      "rejected",
    ])
    .optional(),
});

function toApplication(item: Record<string, unknown>): Application {
  return {
    id: String(item.id),
    userId: String(item.userId),
    workflowSlug: item.workflowSlug as WorkflowSlug,
    status: item.status as ApplicationStatus,
    formData: (item.formData as FormData) ?? {},
    documents: (item.documents as Application["documents"]) ?? [],
    createdAt: String(item.createdAt),
    updatedAt: String(item.updatedAt),
    submittedAt: item.submittedAt ? String(item.submittedAt) : undefined,
  };
}

export const list: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    const user = await requireAuth(event);
    const result = await docClient.send(
      new QueryCommand({
        TableName: APPLICATIONS_TABLE,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
        ExpressionAttributeValues: {
          ":pk": userPk(user.sub),
          ":sk": "APP#",
        },
        ScanIndexForward: false,
      }),
    );

    const applications = (result.Items ?? []).map((item) =>
      toApplication(item as Record<string, unknown>),
    );

    return ok({ applications }, origin);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message, origin);
    console.error(err);
    return serverError(undefined, origin);
  }
};

export const create: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    const user = await requireAuth(event);
    const body = parseBody(event);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid request", parsed.error.flatten(), origin);
    }

    const workflow = getWorkflow(parsed.data.workflowSlug);
    if (!workflow) return badRequest("Unknown workflow", undefined, origin);

    const now = new Date().toISOString();
    const id = uuid();
    const application: Application = {
      id,
      userId: user.sub,
      workflowSlug: parsed.data.workflowSlug,
      status: "draft",
      formData: parsed.data.formData as FormData,
      documents: [],
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: APPLICATIONS_TABLE,
        Item: {
          pk: userPk(user.sub),
          sk: applicationSk(id),
          gsi1pk: workflowGsi1pk(parsed.data.workflowSlug),
          gsi1sk: now,
          entityType: "application",
          ...application,
        },
      }),
    );

    return created({ application, workflow }, origin);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message, origin);
    console.error(err);
    return serverError(undefined, origin);
  }
};

export const get: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    const user = await requireAuth(event);
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing application id", undefined, origin);

    const result = await docClient.send(
      new GetCommand({
        TableName: APPLICATIONS_TABLE,
        Key: { pk: userPk(user.sub), sk: applicationSk(id) },
      }),
    );

    if (!result.Item) return notFound("Application not found", origin);

    const application = toApplication(result.Item as Record<string, unknown>);
    const workflow = getWorkflow(application.workflowSlug);

    return ok({ application, workflow }, origin);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message, origin);
    console.error(err);
    return serverError(undefined, origin);
  }
};

export const update: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    const user = await requireAuth(event);
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing application id", undefined, origin);

    const body = parseBody(event);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid request", parsed.error.flatten(), origin);
    }

    const existing = await docClient.send(
      new GetCommand({
        TableName: APPLICATIONS_TABLE,
        Key: { pk: userPk(user.sub), sk: applicationSk(id) },
      }),
    );
    if (!existing.Item) return notFound("Application not found", origin);

    const now = new Date().toISOString();
    const names: string[] = ["#updatedAt"];
    const values: Record<string, unknown> = { ":updatedAt": now };
    const sets = ["#updatedAt = :updatedAt"];

    if (parsed.data.formData) {
      names.push("#formData");
      values[":formData"] = parsed.data.formData;
      sets.push("#formData = :formData");
    }

    if (parsed.data.status) {
      names.push("#status");
      values[":status"] = parsed.data.status;
      sets.push("#status = :status");

      if (parsed.data.status === "submitted") {
        names.push("#submittedAt");
        values[":submittedAt"] = now;
        sets.push("#submittedAt = :submittedAt");
      }
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: APPLICATIONS_TABLE,
        Key: { pk: userPk(user.sub), sk: applicationSk(id) },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: Object.fromEntries(
          names.map((n) => [n, n.slice(1)]),
        ),
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      }),
    );

    return ok(
      {
        application: toApplication(
          result.Attributes as Record<string, unknown>,
        ),
      },
      origin,
    );
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message, origin);
    console.error(err);
    return serverError(undefined, origin);
  }
};
