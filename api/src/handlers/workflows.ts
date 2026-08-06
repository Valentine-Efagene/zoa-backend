import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getWorkflow, workflows } from "../lib/workflows";
import { badRequest, notFound, ok } from "../lib/response";

export const list: APIGatewayProxyHandlerV2 = async () => {
  return ok({
    workflows: workflows.map((w) => ({
      slug: w.slug,
      name: w.name,
      description: w.description,
      estimatedDays: w.estimatedDays,
      fieldCount:
        w.fields.length +
        w.groups.reduce((n, g) => n + g.fields.length, 0) +
        (w.singulars ?? []).reduce((n, s) => n + s.fields.length, 0),
      documentCount:
        w.documents.length +
        w.groups.reduce((n, g) => n + (g.documents?.length ?? 0), 0) +
        (w.singulars ?? []).reduce(
          (n, s) => n + (s.documents?.length ?? 0),
          0,
        ),
    })),
  });
};

export const get: APIGatewayProxyHandlerV2 = async (event) => {
  const slug = event.pathParameters?.slug;
  if (!slug) return badRequest("Missing workflow slug");

  const workflow = getWorkflow(slug);
  if (!workflow) return notFound("Workflow not found");

  return ok({ workflow });
};
