#!/usr/bin/env npx tsx
/**
 * Copy a dev Cognito user's applications (+ S3 objects) into prod.
 *
 * Usage:
 *   SOURCE_USER_POOL_ID=us-east-1_SBHMsacSo \
 *   PROD_USER_POOL_ID=us-east-1_wOS1H6CvG \
 *   SOURCE_TABLE=zoa-applications-dev \
 *   PROD_TABLE=zoa-applications-prod \
 *   SOURCE_BUCKET=zoa-documents-dev-898751738669 \
 *   PROD_BUCKET=zoa-documents-prod-898751738669 \
 *   npx tsx scripts/migrate-user-to-prod.ts --email user@example.com
 *
 * Optional: --dry-run
 */
import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { CopyObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const emailArg = process.argv.find((a) => a.startsWith("--email="))?.split("=")[1]
  ?? process.argv[process.argv.indexOf("--email") + 1];
const dryRun = process.argv.includes("--dry-run");

if (!emailArg) {
  console.error("Provide --email user@example.com");
  process.exit(1);
}

const region = process.env.AWS_REGION ?? "us-east-1";
const sourceTable = process.env.SOURCE_TABLE ?? "zoa-applications-dev";
const prodTable = process.env.PROD_TABLE ?? "zoa-applications-prod";
const sourceBucket =
  process.env.SOURCE_BUCKET ?? "zoa-documents-dev-898751738669";
const prodBucket =
  process.env.PROD_BUCKET ?? "zoa-documents-prod-898751738669";
const sourcePool = process.env.SOURCE_USER_POOL_ID ?? "us-east-1_SBHMsacSo";
const prodPool = process.env.PROD_USER_POOL_ID ?? "us-east-1_wOS1H6CvG";

const cognito = new CognitoIdentityProviderClient({ region });
const s3 = new S3Client({ region });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
  marshallOptions: { removeUndefinedValues: true },
});

async function findDevUserIdByEmail(email: string): Promise<string> {
  const scan = await ddb.send(
    new ScanCommand({
      TableName: sourceTable,
      FilterExpression: "entityType = :et AND applicantEmail = :email",
      ExpressionAttributeValues: {
        ":et": "application",
        ":email": email,
      },
      ProjectionExpression: "userId",
    }),
  );
  const ids = new Set<string>();
  for (const row of scan.Items ?? []) {
    const userId = (row as { userId?: string }).userId;
    if (userId) ids.add(userId);
  }
  if (ids.size === 0) {
    throw new Error(`No applications found in ${sourceTable} for ${email}`);
  }
  if (ids.size > 1) {
    console.warn("Multiple userIds for email; using first:", [...ids]);
  }
  return [...ids][0];
}

async function ensureProdUser(email: string): Promise<string> {
  try {
    const existing = await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: prodPool,
        Username: email,
      }),
    );
    const sub = existing.UserAttributes?.find((a) => a.Name === "sub")?.Value;
    if (!sub) throw new Error("Prod user exists but sub missing");
    console.log(`Prod Cognito user already exists: ${email} sub=${sub}`);
    return sub;
  } catch (err: unknown) {
    const name =
      err && typeof err === "object" && "name" in err
        ? String((err as { name: string }).name)
        : "";
    if (name !== "UserNotFoundException") throw err;
  }

  if (dryRun) {
    console.log(`[dry-run] Would create prod Cognito user ${email}`);
    return "dry-run-sub";
  }

  const created = await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: prodPool,
      Username: email,
      MessageAction: "SUPPRESS",
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
      ],
    }),
  );
  const sub = created.User?.Attributes?.find((a) => a.Name === "sub")?.Value;
  if (!sub) throw new Error("Failed to read sub after create");
  console.log(`Created prod Cognito user ${email} sub=${sub}`);
  console.log(
    "Set a password: aws cognito-idp admin-set-user-password --user-pool-id ... --username ... --password '...' --permanent",
  );
  return sub;
}

async function copyS3Key(oldKey: string, oldSub: string, newSub: string) {
  const newKey = oldKey.replace(`users/${oldSub}/`, `users/${newSub}/`);
  if (oldKey === newKey) return oldKey;
  if (dryRun) {
    console.log(`[dry-run] s3 copy ${oldKey} -> ${newKey}`);
    return newKey;
  }
  await s3.send(
    new CopyObjectCommand({
      Bucket: prodBucket,
      CopySource: `${sourceBucket}/${oldKey}`,
      Key: newKey,
    }),
  );
  return newKey;
}

async function main() {
  const oldSub = await findDevUserIdByEmail(emailArg);
  console.log(`Dev userId (sub): ${oldSub} for ${emailArg}`);

  const newSub = await ensureProdUser(emailArg);
  if (newSub === "dry-run-sub") {
    console.log("Dry run complete (skipped DynamoDB/S3).");
    return;
  }

  const query = await ddb.send(
    new QueryCommand({
      TableName: sourceTable,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${oldSub}`,
        ":sk": "APP#",
      },
    }),
  );

  const items = (query.Items ?? []) as Record<string, unknown>[];
  console.log(`Found ${items.length} application row(s) to copy`);

  for (const item of items) {
    const documents = (item.documents as Array<Record<string, unknown>>) ?? [];
    const updatedDocs = [];
    for (const doc of documents) {
      const s3Key = String(doc.s3Key ?? "");
      if (s3Key) {
        const newKey = await copyS3Key(s3Key, oldSub, newSub);
        updatedDocs.push({ ...doc, s3Key: newKey });
      } else {
        updatedDocs.push(doc);
      }
    }

    const newItem: Record<string, unknown> = {
      ...item,
      pk: `USER#${newSub}`,
      userId: newSub,
      documents: updatedDocs,
    };

    if (dryRun) {
      console.log(`[dry-run] put ${newItem.sk} id=${newItem.id}`);
      continue;
    }

    await ddb.send(
      new PutCommand({
        TableName: prodTable,
        Item: newItem,
      }),
    );
    console.log(`Copied application ${newItem.id}`);
  }

  console.log("Migration complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
