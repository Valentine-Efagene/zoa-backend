import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";

const dynamo = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(dynamo, {
  marshallOptions: { removeUndefinedValues: true },
});

/**
 * Avoid flexible-checksum headers on browser PUTs — AWS SDK v3 would
 * otherwise sign x-amz-checksum-* that fetch() does not send.
 */
export const s3 = new S3Client({
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export const APPLICATIONS_TABLE =
  process.env.APPLICATIONS_TABLE ?? "zoa-applications-dev";

/** Must match CDK bucket name: zoa-documents-{stage}-{accountId} */
export const DOCUMENTS_BUCKET = process.env.DOCUMENTS_BUCKET ?? "";

if (!DOCUMENTS_BUCKET) {
  console.error("DOCUMENTS_BUCKET is not set");
}
