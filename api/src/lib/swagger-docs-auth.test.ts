import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SWAGGER_DOCS_MISCONFIGURED_MESSAGE,
  SWAGGER_DOCS_PLACEHOLDER_MESSAGE,
  assertSwaggerDocsBasicAuth,
  resolveSwaggerDocsCredentials,
} from "./swagger-docs-auth";

describe("resolveSwaggerDocsCredentials", () => {
  it("rejects missing credentials", () => {
    assert.deepEqual(resolveSwaggerDocsCredentials(undefined, "secret"), {
      ok: false,
      message: SWAGGER_DOCS_MISCONFIGURED_MESSAGE,
    });
  });

  it("rejects REPLACE_ME placeholders", () => {
    assert.deepEqual(
      resolveSwaggerDocsCredentials("REPLACE_ME", "REPLACE_ME"),
      {
        ok: false,
        message: SWAGGER_DOCS_PLACEHOLDER_MESSAGE,
      },
    );
  });

  it("accepts configured credentials", () => {
    assert.deepEqual(
      resolveSwaggerDocsCredentials(" docs-user ", " docs-pass "),
      {
        ok: true,
        user: "docs-user",
        pass: "docs-pass",
      },
    );
  });
});

describe("assertSwaggerDocsBasicAuth", () => {
  it("returns 503 when credentials are not configured", () => {
    const result = assertSwaggerDocsBasicAuth({ headers: {} }, undefined, undefined);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.statusCode, 503);
    assert.equal(result.body, SWAGGER_DOCS_MISCONFIGURED_MESSAGE);
  });

  it("returns 401 when auth header is missing", () => {
    const result = assertSwaggerDocsBasicAuth(
      { headers: {} },
      "docs-user",
      "docs-pass",
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.statusCode, 401);
    assert.match(result.headers["WWW-Authenticate"] ?? "", /Basic/);
  });

  it("accepts matching Basic Auth", () => {
    const token = Buffer.from("docs-user:docs-pass").toString("base64");
    const result = assertSwaggerDocsBasicAuth(
      { headers: { authorization: `Basic ${token}` } },
      "docs-user",
      "docs-pass",
    );
    assert.equal(result.ok, true);
  });
});
