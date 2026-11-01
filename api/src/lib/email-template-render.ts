import type { ApplicationStatus, WorkflowSlug } from "./types";

/** Substituted raw into HTML (URLs and pre-rendered fragments). */
const HTML_RAW_PLACEHOLDER_KEYS = new Set([
  "dashboardLink",
  "adminLink",
  "applicationId",
  "submittedAt",
  "workflowSlug",
  "logoUrl",
  "brandWebsiteUrl",
  "contentHtml",
]);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function applyTemplatePlaceholders(
  template: string,
  variables: Record<string, string>,
  htmlMode: boolean,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = variables[key] ?? "";
    if (htmlMode && !HTML_RAW_PLACEHOLDER_KEYS.has(key)) {
      return escapeHtml(value);
    }
    return value;
  });
}

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

export type TemplateBodies = {
  subject: string;
  textBody: string;
  htmlBody: string;
};

export function buildBrandVariables(appBaseUrl: string): Record<string, string> {
  const base = appBaseUrl.replace(/\/$/, "");
  const portfolio =
    process.env.EMAIL_BRAND_WEBSITE ?? "https://zaynababdussalam.com";
  const logoUrl =
    process.env.EMAIL_LOGO_URL ?? `${base}/brand/mark.png`;

  let brandWebsiteLabel = portfolio;
  try {
    brandWebsiteLabel = new URL(portfolio).host.replace(/^www\./, "");
  } catch {
    // keep full string
  }

  return {
    brandName: "Z.O.A",
    brandLegalName: "Z.O.A Corporate Service Limited",
    brandTagline: "Corporate Service Limited",
    companyRegistration: "RC NO: 8238803",
    brandWebsiteUrl: portfolio,
    brandWebsiteLabel,
    logoUrl,
  };
}

/** Render message fragment, then wrap with layout (logo, footer, etc.). */
export function composeTemplatedEmail(
  message: TemplateBodies,
  layout: Pick<TemplateBodies, "textBody" | "htmlBody">,
  variables: Record<string, string>,
  appBaseUrl: string,
): RenderedEmail {
  const brand = buildBrandVariables(appBaseUrl);
  const merged = { ...brand, ...variables };

  const contentHtml = applyTemplatePlaceholders(
    message.htmlBody,
    merged,
    true,
  );
  const contentText = applyTemplatePlaceholders(
    message.textBody,
    merged,
    false,
  );

  const withContent = {
    ...merged,
    contentHtml,
    contentText,
  };

  return {
    subject: applyTemplatePlaceholders(message.subject, merged, false),
    text: applyTemplatePlaceholders(layout.textBody, withContent, false),
    html: applyTemplatePlaceholders(layout.htmlBody, withContent, true),
  };
}

/** Layout-only preview (no message template). */
export function renderLayoutPreview(
  layout: Pick<TemplateBodies, "textBody" | "htmlBody">,
  variables: Record<string, string>,
  appBaseUrl: string,
): Pick<RenderedEmail, "text" | "html"> {
  const brand = buildBrandVariables(appBaseUrl);
  const merged = { ...brand, ...variables };
  return {
    text: applyTemplatePlaceholders(layout.textBody, merged, false),
    html: applyTemplatePlaceholders(layout.htmlBody, merged, true),
  };
}

/** @deprecated Use composeTemplatedEmail for sends/previews. */
export function renderEmailTemplate(
  subjectTemplate: string,
  textTemplate: string,
  htmlTemplate: string,
  variables: Record<string, string>,
): RenderedEmail {
  return {
    subject: applyTemplatePlaceholders(subjectTemplate, variables, false),
    text: applyTemplatePlaceholders(textTemplate, variables, false),
    html: applyTemplatePlaceholders(htmlTemplate, variables, true),
  };
}

function dashboardUrl(appBaseUrl: string, applicationId: string): string {
  const base = appBaseUrl.replace(/\/$/, "");
  return `${base}/applications/${applicationId}`;
}

function greetingFor(applicantName?: string): string {
  return applicantName ? `Hello ${applicantName},` : "Hello,";
}

export type SubmissionVariableInput = {
  applicationId: string;
  workflowName: string;
  workflowSlug: WorkflowSlug;
  submittedAt: string;
  applicantEmail: string;
  applicantName?: string;
  appBaseUrl: string;
};

export function buildVariablesForSubmission(
  input: SubmissionVariableInput,
): Record<string, string> {
  const base = input.appBaseUrl.replace(/\/$/, "");
  const applicantDisplay = input.applicantName
    ? `${input.applicantName} <${input.applicantEmail}>`
    : input.applicantEmail;

  return {
    greeting: greetingFor(input.applicantName),
    workflowName: input.workflowName,
    workflowSlug: input.workflowSlug,
    applicationId: input.applicationId,
    submittedAt: input.submittedAt,
    applicantEmail: input.applicantEmail,
    applicantDisplay,
    dashboardLink: dashboardUrl(input.appBaseUrl, input.applicationId),
    adminLink: `${base}/admin/applications/${input.applicationId}`,
  };
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  needs_info: "Needs information",
  completed: "Completed",
  rejected: "Rejected",
};

export type StatusVariableInput = {
  applicationId: string;
  workflowName: string;
  newStatus: ApplicationStatus;
  applicantName?: string;
  adminNote?: string;
  appBaseUrl: string;
};

export function buildVariablesForStatus(
  input: StatusVariableInput,
): Record<string, string> {
  return {
    greeting: greetingFor(input.applicantName),
    workflowName: input.workflowName,
    applicationId: input.applicationId,
    statusLabel: STATUS_LABELS[input.newStatus],
    dashboardLink: dashboardUrl(input.appBaseUrl, input.applicationId),
    adminNote: input.adminNote ?? "",
  };
}
