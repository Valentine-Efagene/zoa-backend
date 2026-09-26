import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.AWS_ENDPOINT_URL;
const region =
  process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "us-east-1";

const localCredentials = endpoint
  ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
    }
  : undefined;

const dynamo = new DynamoDBClient({
  region,
  endpoint,
  credentials: localCredentials,
});
export const docClient = DynamoDBDocumentClient.from(dynamo, {
  marshallOptions: { removeUndefinedValues: true },
});

/**
 * Avoid flexible-checksum headers on browser PUTs — AWS SDK v3 would
 * otherwise sign x-amz-checksum-* that fetch() does not send.
 */
export const s3 = new S3Client({
  region,
  endpoint,
  credentials: localCredentials,
  forcePathStyle: Boolean(endpoint),
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
