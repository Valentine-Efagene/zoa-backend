import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import {
  AuthError,
  ForbiddenError,
  requireAuth,
  requireAdmin,
  type AuthUser,
} from "../lib/auth";
import { APPLICATIONS_TABLE, docClient } from "../lib/aws";
import {
  adminGsiPk,
  adminGsiSk,
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
  forbidden,
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
    "business-name-registration",
  ]),
  formData: z.record(z.unknown()).default({}),
});

const userUpdateSchema = z.object({
  formData: z.record(z.unknown()).optional(),
  status: z.enum(["draft", "submitted"]).optional(),
});

const adminUpdateSchema = z.object({
  status: z.enum([
    "submitted",
    "in_review",
    "needs_info",
    "completed",
    "rejected",
  ]),
  adminNote: z.string().max(2000).optional(),
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
    applicantEmail:
      typeof item.applicantEmail === "string"
        ? item.applicantEmail
        : undefined,
    applicantName:
      typeof item.applicantName === "string" ? item.applicantName : undefined,
    adminNote:
      typeof item.adminNote === "string" ? item.adminNote : undefined,
  };
}

async function getItemByApplicationId(id: string) {
  try {
    const byId = await docClient.send(
      new QueryCommand({
        TableName: APPLICATIONS_TABLE,
        IndexName: "gsi-by-id",
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": id },
        Limit: 1,
      }),
    );
    if (byId.Items?.[0]) {
      return byId.Items[0] as Record<string, unknown>;
    }
  } catch {
    // index not ready
  }

  const scan = await docClient.send(
    new ScanCommand({
      TableName: APPLICATIONS_TABLE,
      FilterExpression: "id = :id AND entityType = :e",
      ExpressionAttributeValues: { ":id": id, ":e": "application" },
      Limit: 1,
    }),
  );
  return (scan.Items?.[0] as Record<string, unknown> | undefined) ?? null;
}

async function getOwnedItem(userId: string, id: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: APPLICATIONS_TABLE,
      Key: { pk: userPk(userId), sk: applicationSk(id) },
    }),
  );
  return (result.Item as Record<string, unknown> | undefined) ?? null;
}

function authErrorResponse(err: unknown, origin?: string | null) {
  if (err instanceof ForbiddenError) return forbidden(err.message, origin);
  if (err instanceof AuthError) return unauthorized(err.message, origin);
  console.error(err);
  return serverError(undefined, origin);
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
    return authErrorResponse(err, origin);
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
      applicantEmail: user.email,
      applicantName: user.name,
    };

    await docClient.send(
      new PutCommand({
        TableName: APPLICATIONS_TABLE,
        Item: {
          pk: userPk(user.sub),
          sk: applicationSk(id),
          gsi1pk: workflowGsi1pk(parsed.data.workflowSlug),
          gsi1sk: now,
          gsiAdminPk: adminGsiPk(),
          gsiAdminSk: adminGsiSk(now, id),
          entityType: "application",
          ...application,
        },
      }),
    );

    return created({ application, workflow }, origin);
  } catch (err) {
    return authErrorResponse(err, origin);
  }
};

export const get: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    const user = await requireAuth(event);
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing application id", undefined, origin);

    let item = await getOwnedItem(user.sub, id);
    if (!item && user.isAdmin) {
      item = await getItemByApplicationId(id);
    }
    if (!item) return notFound("Application not found", origin);

    // Non-admins may only access their own
    if (!user.isAdmin && String(item.userId) !== user.sub) {
      return notFound("Application not found", origin);
    }

    const application = toApplication(item);
    const workflow = getWorkflow(application.workflowSlug);

    return ok({ application, workflow }, origin);
  } catch (err) {
    return authErrorResponse(err, origin);
  }
};

export const update: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    const user = await requireAuth(event);
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing application id", undefined, origin);

    const body = parseBody(event);
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid request", parsed.error.flatten(), origin);
    }

    const existing = await getOwnedItem(user.sub, id);
    if (!existing) return notFound("Application not found", origin);

    const currentStatus = String(existing.status) as ApplicationStatus;
    if (currentStatus !== "draft" && currentStatus !== "needs_info") {
      return badRequest(
        "Only draft or needs-info applications can be edited by applicants",
        undefined,
        origin,
      );
    }

    if (parsed.data.status === "submitted" && currentStatus === "needs_info") {
      // resubmit after admin request — allowed
    } else if (
      parsed.data.status &&
      parsed.data.status !== "draft" &&
      parsed.data.status !== "submitted"
    ) {
      return forbidden("Applicants cannot set this status", origin);
    }

    const now = new Date().toISOString();
    const names: string[] = ["#updatedAt", "#gsiAdminSk"];
    const values: Record<string, unknown> = {
      ":updatedAt": now,
      ":gsiAdminSk": adminGsiSk(now, id),
    };
    const sets = ["#updatedAt = :updatedAt", "#gsiAdminSk = :gsiAdminSk"];

    // Ensure admin index keys exist for legacy rows
    names.push("#gsiAdminPk");
    values[":gsiAdminPk"] = adminGsiPk();
    sets.push("#gsiAdminPk = :gsiAdminPk");

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
    return authErrorResponse(err, origin);
  }
};

/** Admin: list all applications (optional ?status=) */
export const adminList: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    await requireAdmin(event);
    const statusFilter = event.queryStringParameters?.status;

    let items: Record<string, unknown>[] = [];

    try {
      const result = await docClient.send(
        new QueryCommand({
          TableName: APPLICATIONS_TABLE,
          IndexName: "gsi-admin",
          KeyConditionExpression: "gsiAdminPk = :pk",
          ExpressionAttributeValues: {
            ":pk": adminGsiPk(),
            ...(statusFilter ? { ":status": statusFilter } : {}),
          },
          ...(statusFilter
            ? {
                FilterExpression: "#status = :status",
                ExpressionAttributeNames: { "#status": "status" },
              }
            : {}),
          ScanIndexForward: false,
          Limit: 100,
        }),
      );
      items = (result.Items ?? []) as Record<string, unknown>[];
    } catch {
      // Index may not exist yet on older tables
      items = [];
    }

    // Fallback / merge for rows written before admin GSI existed
    if (items.length < 20) {
      const scan = await docClient.send(
        new ScanCommand({
          TableName: APPLICATIONS_TABLE,
          FilterExpression: "entityType = :e",
          ExpressionAttributeValues: { ":e": "application" },
          Limit: 100,
        }),
      );
      const byId = new Map<string, Record<string, unknown>>();
      for (const item of items) {
        byId.set(String(item.id), item);
      }
      for (const item of scan.Items ?? []) {
        const row = item as Record<string, unknown>;
        byId.set(String(row.id), row);
      }
      items = [...byId.values()];
    }

    let applications = items.map((item) => toApplication(item));

    if (statusFilter) {
      applications = applications.filter((a) => a.status === statusFilter);
    } else {
      applications = applications.filter((a) => a.status !== "draft");
    }

    applications.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return ok({ applications }, origin);
  } catch (err) {
    return authErrorResponse(err, origin);
  }
};

/** Admin: get any application by id */
export const adminGet: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    await requireAdmin(event);
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing application id", undefined, origin);

    const item = await getItemByApplicationId(id);
    if (!item) return notFound("Application not found", origin);

    const application = toApplication(item);
    const workflow = getWorkflow(application.workflowSlug);
    return ok({ application, workflow }, origin);
  } catch (err) {
    return authErrorResponse(err, origin);
  }
};

/** Admin: update review status / note */
export const adminUpdate: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    await requireAdmin(event);
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing application id", undefined, origin);

    const body = parseBody(event);
    const parsed = adminUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid request", parsed.error.flatten(), origin);
    }

    const item = await getItemByApplicationId(id);
    if (!item) return notFound("Application not found", origin);

    const now = new Date().toISOString();
    const names = ["#updatedAt", "#status", "#gsiAdminPk", "#gsiAdminSk"];
    const values: Record<string, unknown> = {
      ":updatedAt": now,
      ":status": parsed.data.status,
      ":gsiAdminPk": adminGsiPk(),
      ":gsiAdminSk": adminGsiSk(now, id),
    };
    const sets = [
      "#updatedAt = :updatedAt",
      "#status = :status",
      "#gsiAdminPk = :gsiAdminPk",
      "#gsiAdminSk = :gsiAdminSk",
    ];

    if (parsed.data.adminNote !== undefined) {
      names.push("#adminNote");
      values[":adminNote"] = parsed.data.adminNote;
      sets.push("#adminNote = :adminNote");
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: APPLICATIONS_TABLE,
        Key: {
          pk: String(item.pk),
          sk: String(item.sk),
        },
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
    return authErrorResponse(err, origin);
  }
};

// silence unused import lint if AuthUser used only as type elsewhere
export type { AuthUser };
