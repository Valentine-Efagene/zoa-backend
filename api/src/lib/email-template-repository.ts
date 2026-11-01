import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, EMAIL_TEMPLATES_TABLE } from "./aws";
import {
  EMAIL_TEMPLATE_SK,
  EMAIL_LAYOUT_ID,
  getDefaultTemplate,
  isEmailTemplateId,
  DEFAULT_EMAIL_TEMPLATES,
  type EmailTemplateId,
  type EmailTemplateRecord,
} from "./email-template-defaults";

const CACHE_TTL_MS = 60_000;

type CacheEntry = { fetchedAt: number; template: EmailTemplateRecord };

const cache = new Map<EmailTemplateId, CacheEntry>();

function itemToRecord(item: Record<string, unknown>): EmailTemplateRecord {
  const id = String(item.pk);
  if (!isEmailTemplateId(id)) {
    throw new Error(`Unknown template id in database: ${id}`);
  }
  return {
    id,
    name: String(item.name ?? id),
    description: String(item.description ?? ""),
    subject: String(item.subject ?? ""),
    textBody: String(item.textBody ?? ""),
    htmlBody: String(item.htmlBody ?? ""),
    sampleVariables:
      (item.sampleVariables as Record<string, string> | undefined) ?? {},
    kind:
      item.kind === "layout" || item.kind === "message"
        ? item.kind
        : id === EMAIL_LAYOUT_ID
          ? "layout"
          : "message",
  };
}

export function recordToDynamoItem(
  template: EmailTemplateRecord,
  updatedAt: string,
): Record<string, unknown> {
  return {
    pk: template.id,
    sk: EMAIL_TEMPLATE_SK,
    name: template.name,
    description: template.description,
    subject: template.subject,
    textBody: template.textBody,
    htmlBody: template.htmlBody,
    sampleVariables: template.sampleVariables,
    kind: template.kind,
    updatedAt,
  };
}

export async function getEmailTemplate(
  id: EmailTemplateId,
): Promise<EmailTemplateRecord> {
  const cached = cache.get(id);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.template;
  }

  const fallback = getDefaultTemplate(id);
  if (!fallback) {
    throw new Error(`No default template for id: ${id}`);
  }

  if (!EMAIL_TEMPLATES_TABLE) {
    return fallback;
  }

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: EMAIL_TEMPLATES_TABLE,
        Key: { pk: id, sk: EMAIL_TEMPLATE_SK },
      }),
    );
    if (result.Item) {
      const template = itemToRecord(result.Item);
      cache.set(id, { fetchedAt: Date.now(), template });
      return template;
    }
    console.warn("Email template missing in DB, using default", { id });
  } catch (err) {
    console.warn("Email template fetch failed, using default", { id, err });
  }

  return fallback;
}

export async function getEmailLayout(): Promise<EmailTemplateRecord> {
  return getEmailTemplate(EMAIL_LAYOUT_ID);
}

export async function listEmailTemplates(): Promise<
  Pick<EmailTemplateRecord, "id" | "name" | "description" | "kind">[]
> {
  const summaries = await Promise.all(
    DEFAULT_EMAIL_TEMPLATES.map(async (def) => {
      const t = await getEmailTemplate(def.id);
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        kind: t.kind,
      };
    }),
  );
  return summaries;
}

export function clearEmailTemplateCache(): void {
  cache.clear();
}
