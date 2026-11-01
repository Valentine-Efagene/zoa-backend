import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyTemplatePlaceholders,
  composeTemplatedEmail,
} from "./email-template-render";
import {
  DEFAULT_EMAIL_LAYOUT,
  DEFAULT_EMAIL_MESSAGE_TEMPLATES,
} from "./email-template-defaults";

describe("applyTemplatePlaceholders", () => {
  it("replaces placeholders in subject and text", () => {
    const out = applyTemplatePlaceholders("Hello {{name}}", { name: "Ada" }, false);
    assert.equal(out, "Hello Ada");
  });

  it("escapes HTML in html mode for user content", () => {
    const out = applyTemplatePlaceholders(
      "<p>{{note}}</p>",
      { note: "<script>" },
      true,
    );
    assert.equal(out, "<p>&lt;script&gt;</p>");
  });

  it("does not escape URL placeholders in html", () => {
    const out = applyTemplatePlaceholders(
      '<a href="{{dashboardLink}}">Go</a>',
      { dashboardLink: "https://example.com/app/1" },
      true,
    );
    assert.equal(out, '<a href="https://example.com/app/1">Go</a>');
  });
});

describe("composeTemplatedEmail", () => {
  it("wraps message HTML in layout with logo slot", () => {
    const message = DEFAULT_EMAIL_MESSAGE_TEMPLATES[0];
    const rendered = composeTemplatedEmail(
      message,
      DEFAULT_EMAIL_LAYOUT,
      message.sampleVariables,
      "https://zoa-theta.vercel.app",
    );
    assert.match(rendered.html, /brand\/mark\.png/);
    assert.match(rendered.html, /Corporate Service Limited/);
    assert.match(rendered.html, /submitted successfully/);
    assert.match(rendered.subject, /Company limited by shares/);
  });
});
