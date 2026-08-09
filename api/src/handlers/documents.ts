import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import {
  AuthError,
  ForbiddenError,
  requireAuth,
} from "../lib/auth";
import {
  APPLICATIONS_TABLE,
  DOCUMENTS_BUCKET,
  docClient,
  s3,
} from "../lib/aws";
import {
  applicationSk,
  userPk,
  type ApplicationDocument,
} from "../lib/types";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  originFromEvent,
  parseBody,
  serverError,
  unauthorized,
} from "../lib/response";
import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const uploadSchema = z.object({
  documentType: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive().max(20 * 1024 * 1024),
  /** e.g. "directors:0" or "secretary" for scoped docs */
  ownerKey: z.string().optional(),
});

async function getApplicationItem(applicationId: string, userId: string) {
  const owned = await docClient.send(
    new GetCommand({
      TableName: APPLICATIONS_TABLE,
      Key: { pk: userPk(userId), sk: applicationSk(applicationId) },
    }),
  );
  if (owned.Item) return owned.Item as Record<string, unknown>;

  try {
    const byId = await docClient.send(
      new QueryCommand({
        TableName: APPLICATIONS_TABLE,
        IndexName: "gsi-by-id",
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": applicationId },
        Limit: 1,
      }),
    );
    if (byId.Items?.[0]) return byId.Items[0] as Record<string, unknown>;
  } catch {
    // index may not exist
  }

  const scan = await docClient.send(
    new ScanCommand({
      TableName: APPLICATIONS_TABLE,
      FilterExpression: "id = :id AND entityType = :e",
      ExpressionAttributeValues: {
        ":id": applicationId,
        ":e": "application",
      },
      Limit: 1,
    }),
  );
  return (scan.Items?.[0] as Record<string, unknown> | undefined) ?? null;
}

export const createUploadUrl: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    const user = await requireAuth(event);
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing application id", undefined, origin);

    const body = parseBody(event);
    const parsed = uploadSchema.safeParse(body);
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

    if (!DOCUMENTS_BUCKET) {
      console.error("DOCUMENTS_BUCKET env is empty");
      return serverError("Document storage is not configured", origin);
    }

    const documentId = uuid();
    const safeName = parsed.data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ownerPart = parsed.data.ownerKey
      ? parsed.data.ownerKey.replace(/[^a-zA-Z0-9:_-]/g, "_")
      : "root";
    const s3Key = `users/${user.sub}/applications/${id}/${ownerPart}/${parsed.data.documentType}/${documentId}-${safeName}`;

    // Only ContentType is required from the browser. Do not sign ContentLength,
    // Metadata, or checksum fields — browser fetch() will not send them.
    const command = new PutObjectCommand({
      Bucket: DOCUMENTS_BUCKET,
      Key: s3Key,
      ContentType: parsed.data.contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 900,
      signableHeaders: new Set(["content-type"]),
    });

    const document: ApplicationDocument = {
      id: documentId,
      documentType: parsed.data.documentType,
      ownerKey: parsed.data.ownerKey,
      fileName: parsed.data.fileName,
      contentType: parsed.data.contentType,
      size: parsed.data.size,
      s3Key,
      uploadedAt: new Date().toISOString(),
      status: "pending",
    };

    const currentDocs =
      (existing.Item.documents as ApplicationDocument[] | undefined) ?? [];
    const withoutSame = currentDocs.filter((d) => {
      if (d.documentType !== parsed.data.documentType) return true;
      return (d.ownerKey ?? "") !== (parsed.data.ownerKey ?? "");
    });

    await docClient.send(
      new UpdateCommand({
        TableName: APPLICATIONS_TABLE,
        Key: { pk: userPk(user.sub), sk: applicationSk(id) },
        UpdateExpression:
          "SET documents = :documents, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":documents": [...withoutSame, document],
          ":updatedAt": new Date().toISOString(),
        },
      }),
    );

    return ok({ uploadUrl, document }, origin);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message, origin);
    console.error(err);
    return serverError(undefined, origin);
  }
};

/** Presigned GET for a stored document (owner or admin). */
export const createDownloadUrl: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    const user = await requireAuth(event);
    const applicationId = event.pathParameters?.id;
    const documentId = event.pathParameters?.documentId;
    if (!applicationId || !documentId) {
      return badRequest("Missing application or document id", undefined, origin);
    }

    if (!DOCUMENTS_BUCKET) {
      return serverError("Document storage is not configured", origin);
    }

    const item = await getApplicationItem(applicationId, user.sub);
    if (!item) return notFound("Application not found", origin);

    if (!user.isAdmin && String(item.userId) !== user.sub) {
      return forbidden("You cannot download this document", origin);
    }

    const documents =
      (item.documents as ApplicationDocument[] | undefined) ?? [];
    const doc = documents.find((d) => d.id === documentId);
    if (!doc?.s3Key) return notFound("Document not found", origin);

    const command = new GetObjectCommand({
      Bucket: DOCUMENTS_BUCKET,
      Key: doc.s3Key,
      ResponseContentDisposition: `attachment; filename="${doc.fileName.replace(/"/g, "")}"`,
    });

    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    return ok({ downloadUrl, document: doc }, origin);
  } catch (err) {
    if (err instanceof ForbiddenError) return forbidden(err.message, origin);
    if (err instanceof AuthError) return unauthorized(err.message, origin);
    console.error(err);
    return serverError(undefined, origin);
  }
};
