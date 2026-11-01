#!/usr/bin/env npx tsx
/**
 * Seed DynamoDB email templates from in-repo defaults.
 * Usage: EMAIL_TEMPLATES_TABLE=zoa-email-templates-dev npm run seed:email-templates
 *        npm run seed:email-templates -- --force   # overwrite existing rows
 */
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, EMAIL_TEMPLATES_TABLE } from "../src/lib/aws";
import {
  DEFAULT_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_SK,
} from "../src/lib/email-template-defaults";
import { recordToDynamoItem } from "../src/lib/email-template-repository";

const force = process.argv.includes("--force");

async function main() {
  if (!EMAIL_TEMPLATES_TABLE) {
    console.error("EMAIL_TEMPLATES_TABLE is not set");
    process.exit(1);
  }

  const updatedAt = new Date().toISOString();
  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const template of DEFAULT_EMAIL_TEMPLATES) {
    const item = recordToDynamoItem(template, updatedAt);
    try {
      await docClient.send(
        new PutCommand({
          TableName: EMAIL_TEMPLATES_TABLE,
          Item: item,
          ...(force
            ? {}
            : { ConditionExpression: "attribute_not_exists(pk)" }),
        }),
      );
      if (force) {
        updated += 1;
        console.log(`Upserted ${template.id}`);
      } else {
        created += 1;
        console.log(`Created ${template.id}`);
      }
    } catch (err: unknown) {
      const name =
        err && typeof err === "object" && "name" in err
          ? String((err as { name: string }).name)
          : "";
      if (name === "ConditionalCheckFailedException" && !force) {
        skipped += 1;
        console.log(`Skipped ${template.id} (already exists)`);
        continue;
      }
      throw err;
    }
  }

  console.log(
    `Done. created=${created} skipped=${skipped} upserted=${updated} table=${EMAIL_TEMPLATES_TABLE} sk=${EMAIL_TEMPLATE_SK}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
