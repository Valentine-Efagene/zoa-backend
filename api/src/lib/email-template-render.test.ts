import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderEmailTemplate } from "./email-template-render";

describe("renderEmailTemplate", () => {
  it("replaces placeholders in subject and text", () => {
    const out = renderEmailTemplate(
      "Hello {{name}}",
      "Body {{name}}",
      "<p>{{name}}</p>",
      { name: "Ada" },
    );
    assert.equal(out.subject, "Hello Ada");
    assert.equal(out.text, "Body Ada");
    assert.equal(out.html, "<p>Ada</p>");
  });

  it("escapes HTML in html body for user content", () => {
    const out = renderEmailTemplate(
      "x",
      "{{note}}",
      "<p>{{note}}</p>",
      { note: "<script>" },
    );
    assert.equal(out.text, "<script>");
    assert.equal(out.html, "<p>&lt;script&gt;</p>");
  });

  it("does not escape URL placeholders in html", () => {
    const out = renderEmailTemplate(
      "x",
      "x",
      '<a href="{{dashboardLink}}">Go</a>',
      { dashboardLink: "https://example.com/app/1" },
    );
    assert.equal(
      out.html,
      '<a href="https://example.com/app/1">Go</a>',
    );
  });
});
