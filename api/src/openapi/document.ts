export type OpenApiDocument = Record<string, unknown>;

const workflowSlugEnum = [
  "company-limited-by-shares",
  "company-limited-by-guarantee",
  "incorporated-trustees",
  "scuml-registration",
  "business-name-registration",
  "exporters-registration-certificate",
  "taxpromax-registration",
  "trademark-registration",
] as const;

const applicationStatusEnum = [
  "draft",
  "submitted",
  "in_review",
  "needs_info",
  "completed",
  "rejected",
] as const;

const adminStatusEnum = [
  "submitted",
  "in_review",
  "needs_info",
  "completed",
  "rejected",
] as const;

const bearerSecurity = [{ bearerAuth: [] as string[] }];

export function getOpenApiDocument(): OpenApiDocument {
  const stage = process.env.STAGE ?? "dev";

  return {
    openapi: "3.0.3",
    info: {
      title: "Z.O.A Filings API",
      version: "0.1.0",
      description: [
        "REST API for Z.O.A registration workflows, applications, documents, and admin operations.",
        "",
        `Deployed stage: **${stage}**.`,
        "",
        "### Authentication",
        "Protected routes require a Cognito **JWT** in `Authorization: Bearer <token>`.",
        "Admin routes require the user to be in the Cognito `admin` group.",
        "",
        "Non-prod only (local / dev): `Bearer dev-token`, `Bearer dev-admin-token`, or omit Cognito env and use configured dev bypass.",
        "",
        "### Errors",
        'JSON errors use `{ "error": string, "details"?: unknown }` with matching HTTP status.',
      ].join("\n"),
    },
    servers: [{ url: "/" }],
    tags: [
      { name: "Health", description: "Liveness" },
      { name: "Workflows", description: "Public workflow definitions" },
      { name: "Applications", description: "Applicant applications" },
      { name: "Documents", description: "Presigned S3 upload/download" },
      { name: "Admin", description: "Admin-only application management" },
      { name: "Email templates", description: "Admin email template preview" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Cognito access token",
        },
      },
      schemas: {
        ErrorBody: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: {},
          },
          required: ["error"],
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            service: { type: "string", example: "zoa-api" },
            stage: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        WorkflowSummary: {
          type: "object",
          properties: {
            slug: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            estimatedDays: { type: "integer" },
            fieldCount: { type: "integer" },
            documentCount: { type: "integer" },
          },
        },
        Application: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string" },
            workflowSlug: { type: "string", enum: [...workflowSlugEnum] },
            status: { type: "string", enum: [...applicationStatusEnum] },
            formData: {
              type: "object",
              additionalProperties: true,
              description: "Workflow-specific field values",
            },
            documents: {
              type: "array",
              items: { $ref: "#/components/schemas/ApplicationDocument" },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            submittedAt: { type: "string", format: "date-time" },
            applicantEmail: { type: "string" },
            applicantName: { type: "string" },
            adminNote: { type: "string" },
          },
        },
        ApplicationDocument: {
          type: "object",
          properties: {
            id: { type: "string" },
            documentType: { type: "string" },
            fileName: { type: "string" },
            contentType: { type: "string" },
            size: { type: "integer" },
            ownerKey: { type: "string" },
            uploadedAt: { type: "string", format: "date-time" },
          },
        },
        CreateApplicationRequest: {
          type: "object",
          required: ["workflowSlug"],
          properties: {
            workflowSlug: { type: "string", enum: [...workflowSlugEnum] },
            formData: { type: "object", additionalProperties: true },
          },
        },
        UpdateApplicationRequest: {
          type: "object",
          properties: {
            formData: { type: "object", additionalProperties: true },
            status: { type: "string", enum: ["draft", "submitted"] },
          },
        },
        AdminUpdateApplicationRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: [...adminStatusEnum] },
            adminNote: { type: "string", maxLength: 2000 },
          },
        },
        UploadUrlRequest: {
          type: "object",
          required: ["documentType", "fileName", "contentType", "size"],
          properties: {
            documentType: { type: "string" },
            fileName: { type: "string" },
            contentType: { type: "string" },
            size: { type: "integer", maximum: 20971520 },
            ownerKey: {
              type: "string",
              description: 'Scope e.g. "directors:0" or "secretary"',
            },
          },
        },
        UploadUrlResponse: {
          type: "object",
          properties: {
            uploadUrl: { type: "string", format: "uri" },
            document: { $ref: "#/components/schemas/ApplicationDocument" },
          },
        },
        DownloadUrlResponse: {
          type: "object",
          properties: {
            downloadUrl: { type: "string", format: "uri" },
          },
        },
        EmailTemplateSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            kind: { type: "string", enum: ["message", "layout"] },
          },
        },
        EmailTemplatePreviewRequest: {
          type: "object",
          properties: {
            variables: {
              type: "object",
              additionalProperties: { type: "string" },
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Missing or invalid bearer token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorBody" },
            },
          },
        },
        Forbidden: {
          description: "Authenticated but not allowed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorBody" },
            },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
          },
        },
      },
      "/workflows": {
        get: {
          tags: ["Workflows"],
          summary: "List workflow summaries",
          responses: {
            "200": {
              description: "Workflow list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      workflows: {
                        type: "array",
                        items: { $ref: "#/components/schemas/WorkflowSummary" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/workflows/{slug}": {
        get: {
          tags: ["Workflows"],
          summary: "Get full workflow definition",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Workflow definition",
              content: { "application/json": { schema: { type: "object" } } },
            },
            "404": { description: "Not found" },
          },
        },
      },
      "/applications": {
        get: {
          tags: ["Applications"],
          summary: "List current user's applications",
          security: bearerSecurity,
          responses: {
            "200": {
              description: "Applications",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      applications: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Application" },
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          tags: ["Applications"],
          summary: "Create application",
          security: bearerSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateApplicationRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      application: { $ref: "#/components/schemas/Application" },
                    },
                  },
                },
              },
            },
            "400": { description: "Validation error" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/applications/{id}": {
        get: {
          tags: ["Applications"],
          summary: "Get application",
          security: bearerSecurity,
          parameters: [pathId()],
          responses: {
            "200": {
              description: "Application",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      application: { $ref: "#/components/schemas/Application" },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { description: "Not found" },
          },
        },
        patch: {
          tags: ["Applications"],
          summary: "Update draft or submit application",
          security: bearerSecurity,
          parameters: [pathId()],
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateApplicationRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Updated application" },
            "400": { description: "Validation error" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/applications/{id}/documents/upload-url": {
        post: {
          tags: ["Documents"],
          summary: "Create presigned upload URL",
          security: bearerSecurity,
          parameters: [pathId()],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UploadUrlRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Upload URL",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UploadUrlResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/applications/{id}/documents/{documentId}/download-url": {
        get: {
          tags: ["Documents"],
          summary: "Create presigned download URL",
          security: bearerSecurity,
          parameters: [pathId(), pathDocumentId()],
          responses: {
            "200": {
              description: "Download URL",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DownloadUrlResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { description: "Not found" },
          },
        },
      },
      "/admin/applications": {
        get: {
          tags: ["Admin"],
          summary: "List all applications (admin)",
          security: bearerSecurity,
          responses: {
            "200": {
              description: "Applications",
              content: { "application/json": { schema: { type: "object" } } },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/admin/applications/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Get application (admin)",
          security: bearerSecurity,
          parameters: [pathId()],
          responses: {
            "200": { description: "Application" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        patch: {
          tags: ["Admin"],
          summary: "Update application status (admin)",
          security: bearerSecurity,
          parameters: [pathId()],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AdminUpdateApplicationRequest",
                },
              },
            },
          },
          responses: {
            "200": { description: "Updated" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/admin/email-templates": {
        get: {
          tags: ["Email templates"],
          summary: "List email templates (admin)",
          security: bearerSecurity,
          responses: {
            "200": {
              description: "Templates",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      templates: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/EmailTemplateSummary",
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/admin/email-templates/{id}": {
        get: {
          tags: ["Email templates"],
          summary: "Get email template (admin)",
          security: bearerSecurity,
          parameters: [pathTemplateId()],
          responses: {
            "200": { description: "Template detail" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/admin/email-templates/{id}/preview": {
        post: {
          tags: ["Email templates"],
          summary: "Render template preview (admin)",
          security: bearerSecurity,
          parameters: [pathTemplateId()],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/EmailTemplatePreviewRequest",
                },
              },
            },
          },
          responses: {
            "200": { description: "Rendered subject/html/text" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
    },
  };
}

function pathId() {
  return {
    name: "id",
    in: "path" as const,
    required: true,
    schema: { type: "string", format: "uuid" },
  };
}

function pathDocumentId() {
  return {
    name: "documentId",
    in: "path" as const,
    required: true,
    schema: { type: "string" },
  };
}

function pathTemplateId() {
  return {
    name: "id",
    in: "path" as const,
    required: true,
    schema: { type: "string" },
    description: "Template id e.g. layout_standard or message key",
  };
}
