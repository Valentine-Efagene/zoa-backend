import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { z } from "zod";
import { AuthError, ForbiddenError, requireAdmin } from "../lib/auth";
import {
  getDefaultTemplate,
  isEmailTemplateId,
} from "../lib/email-template-defaults";
import { getEmailTemplate } from "../lib/email-template-repository";
import { previewEmailTemplate } from "../lib/email-templates";
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

function authErrorResponse(err: unknown, origin?: string | null) {
  if (err instanceof ForbiddenError) return forbidden(err.message, origin);
  if (err instanceof AuthError) return unauthorized(err.message, origin);
  console.error(err);
  return serverError(undefined, origin);
}

export const adminList: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    await requireAdmin(event);
    const { listEmailTemplates } = await import(
      "../lib/email-template-repository"
    );
    const templates = await listEmailTemplates();
    return ok({ templates }, origin);
  } catch (err) {
    return authErrorResponse(err, origin);
  }
};

export const adminGet: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    await requireAdmin(event);
    const id = event.pathParameters?.id;
    if (!id || !isEmailTemplateId(id)) {
      return badRequest("Invalid template id", undefined, origin);
    }
    const template = await getEmailTemplate(id);
    return ok(
      {
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          subject: template.subject,
          textBody: template.textBody,
          htmlBody: template.htmlBody,
          sampleVariables: template.sampleVariables,
        },
      },
      origin,
    );
  } catch (err) {
    return authErrorResponse(err, origin);
  }
};

const previewSchema = z.object({
  variables: z.record(z.string()).optional(),
});

export const adminPreview: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = originFromEvent(event);
  try {
    await requireAdmin(event);
    const id = event.pathParameters?.id;
    if (!id || !isEmailTemplateId(id)) {
      return badRequest("Invalid template id", undefined, origin);
    }
    if (!getDefaultTemplate(id)) {
      return notFound("Template not found", origin);
    }

    const body = parseBody(event);
    const parsed = previewSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid request", parsed.error.flatten(), origin);
    }

    const rendered = await previewEmailTemplate(
      id,
      parsed.data.variables,
    );
    return ok({ preview: rendered }, origin);
  } catch (err) {
    return authErrorResponse(err, origin);
  }
};
