import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { AuthError, requireAuth } from "../lib/auth";
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
  notFound,
  ok,
  parseBody,
  serverError,
  unauthorized,
} from "../lib/response";

const uploadSchema = z.object({
  documentType: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive().max(20 * 1024 * 1024),
  /** e.g. "directors:0" or "secretary" for scoped docs */
  ownerKey: z.string().optional(),
});

export const createUploadUrl: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireAuth(event);
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing application id");

    const body = parseBody(event);
    const parsed = uploadSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid request", parsed.error.flatten());
    }

    const existing = await docClient.send(
      new GetCommand({
        TableName: APPLICATIONS_TABLE,
        Key: { pk: userPk(user.sub), sk: applicationSk(id) },
      }),
    );
    if (!existing.Item) return notFound("Application not found");

    const documentId = uuid();
    const safeName = parsed.data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ownerPart = parsed.data.ownerKey
      ? parsed.data.ownerKey.replace(/[^a-zA-Z0-9:_-]/g, "_")
      : "root";
    const s3Key = `users/${user.sub}/applications/${id}/${ownerPart}/${parsed.data.documentType}/${documentId}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: DOCUMENTS_BUCKET,
      Key: s3Key,
      ContentType: parsed.data.contentType,
      ContentLength: parsed.data.size,
      Metadata: {
        applicationId: id,
        documentType: parsed.data.documentType,
        userId: user.sub,
        ...(parsed.data.ownerKey ? { ownerKey: parsed.data.ownerKey } : {}),
      },
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

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

    return ok({ uploadUrl, document });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error(err);
    return serverError();
  }
};
