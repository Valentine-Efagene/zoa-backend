import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";

const dynamo = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(dynamo, {
  marshallOptions: { removeUndefinedValues: true },
});

export const s3 = new S3Client({});

export const APPLICATIONS_TABLE =
  process.env.APPLICATIONS_TABLE ?? "zoa-applications-dev";
export const DOCUMENTS_BUCKET =
  process.env.DOCUMENTS_BUCKET ?? "zoa-documents-dev";
