import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getOpenApiDocument } from "../openapi/document";
import {
  assertSwaggerDocsBasicAuth,
  swaggerDocsAuthFailureToResponse,
} from "../lib/swagger-docs-auth";

function gate(event: Parameters<typeof assertSwaggerDocsBasicAuth>[0]) {
  const auth = assertSwaggerDocsBasicAuth(event);
  if (!auth.ok) {
    return swaggerDocsAuthFailureToResponse(auth);
  }
  return null;
}

export const openApiJson: APIGatewayProxyHandlerV2 = async (event) => {
  const denied = gate(event);
  if (denied) {
    return denied;
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(getOpenApiDocument()),
  };
};

const SWAGGER_UI_VERSION = "5.18.2";

export const swaggerUi: APIGatewayProxyHandlerV2 = async (event) => {
  const denied = gate(event);
  if (denied) {
    return denied;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Z.O.A Filings API docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: './openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
      });
    };
  </script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: html,
  };
};
