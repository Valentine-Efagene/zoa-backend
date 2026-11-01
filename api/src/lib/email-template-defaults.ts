import type { ApplicationStatus } from "./types";

export const EMAIL_TEMPLATE_SK = "v1";

export const EMAIL_LAYOUT_ID = "layout_standard" as const;

export const EMAIL_MESSAGE_TEMPLATE_IDS = [
  "submission_applicant",
  "submission_admin",
  "status_in_review",
  "status_needs_info",
  "status_completed",
  "status_rejected",
] as const;

export type EmailMessageTemplateId = (typeof EMAIL_MESSAGE_TEMPLATE_IDS)[number];
export type EmailTemplateId =
  | EmailMessageTemplateId
  | typeof EMAIL_LAYOUT_ID;

export type EmailTemplateRecord = {
  id: EmailTemplateId;
  name: string;
  description: string;
  /** Empty for layout-only rows. */
  subject: string;
  textBody: string;
  htmlBody: string;
  sampleVariables: Record<string, string>;
  kind: "layout" | "message";
};

const SAMPLE_APP_ID = "550e8400-e29b-41d4-a716-446655440000";
const SAMPLE_SUBMITTED = "2026-11-01T10:30:00.000Z";
const SAMPLE_BASE = "https://zoa-theta.vercel.app";

const sharedSampleBrand: Record<string, string> = {
  brandName: "Z.O.A",
  brandLegalName: "Z.O.A Corporate Service Limited",
  brandTagline: "Corporate Service Limited",
  companyRegistration: "RC NO: 8238803",
  brandWebsiteUrl: "https://zaynababdussalam.com",
  brandWebsiteLabel: "zaynababdussalam.com",
  logoUrl: `${SAMPLE_BASE}/brand/mark.png`,
};

const sharedSampleSubmission: Record<string, string> = {
  ...sharedSampleBrand,
  greeting: "Hello Jane Doe,",
  workflowName: "Company limited by shares",
  workflowSlug: "company-limited-by-shares",
  applicationId: SAMPLE_APP_ID,
  submittedAt: SAMPLE_SUBMITTED,
  applicantEmail: "applicant@example.com",
  applicantDisplay: "Jane Doe <applicant@example.com>",
  dashboardLink: `${SAMPLE_BASE}/applications/${SAMPLE_APP_ID}`,
  adminLink: `${SAMPLE_BASE}/admin/applications/${SAMPLE_APP_ID}`,
};

const sharedSampleStatus: Record<string, string> = {
  ...sharedSampleBrand,
  greeting: "Hello Jane Doe,",
  workflowName: "Company limited by shares",
  applicationId: SAMPLE_APP_ID,
  statusLabel: "In review",
  dashboardLink: `${SAMPLE_BASE}/applications/${SAMPLE_APP_ID}`,
  adminNote:
    "Please upload a clearer copy of your identification document.",
};

const sampleLayoutContent = {
  contentHtml: `<p style="margin:0 0 16px;">Hello Jane Doe,</p>
<p style="margin:0 0 16px;">This is a sample of the message area. Business templates only edit this section.</p>
<p style="margin:0;"><a href="${SAMPLE_BASE}/applications/${SAMPLE_APP_ID}" style="color:#1e3a5f;font-weight:600;">View your application</a></p>`,
  contentText: [
    "Hello Jane Doe,",
    "",
    "This is a sample of the message area. Business templates only edit this section.",
    "",
    `View your application: ${SAMPLE_BASE}/applications/${SAMPLE_APP_ID}`,
  ].join("\n"),
};

export const DEFAULT_EMAIL_LAYOUT: EmailTemplateRecord = {
  id: EMAIL_LAYOUT_ID,
  kind: "layout",
  name: "Standard layout",
  description:
    "Shared wrapper: logo, brand, footer, and slots for message content ({{contentHtml}} / {{contentText}}).",
  subject: "",
  textBody: [`{{contentText}}`, "", "—", "{{brandLegalName}} · {{companyRegistration}}", "{{brandWebsiteUrl}}"].join(
    "\n",
  ),
  htmlBody: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{{brandName}}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
<tr><td style="padding:28px 32px 20px;text-align:center;border-bottom:1px solid #f4f4f5;">
<a href="{{brandWebsiteUrl}}" style="text-decoration:none;display:inline-block;">
<img src="{{logoUrl}}" alt="{{brandName}}" width="52" height="52" style="display:block;margin:0 auto 10px;border:0;" />
<span style="display:block;font-size:22px;font-weight:600;line-height:1.1;color:#e85d04;letter-spacing:-0.02em;">{{brandName}}</span>
<span style="display:block;margin-top:6px;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#1e3a5f;">{{brandTagline}}</span>
</a>
</td></tr>
<tr><td style="padding:32px;color:#18181b;font-size:15px;line-height:1.65;">
{{contentHtml}}
</td></tr>
<tr><td style="padding:22px 32px 28px;background:#fafafa;border-top:1px solid #f4f4f5;font-size:12px;line-height:1.55;color:#71717a;text-align:center;">
<p style="margin:0 0 6px;"><strong style="color:#52525b;font-weight:600;">{{brandLegalName}}</strong> · {{companyRegistration}}</p>
<p style="margin:0;"><a href="{{brandWebsiteUrl}}" style="color:#1e3a5f;text-decoration:none;">{{brandWebsiteLabel}}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  sampleVariables: {
    ...sharedSampleBrand,
    ...sampleLayoutContent,
  },
};

export const DEFAULT_EMAIL_MESSAGE_TEMPLATES: EmailTemplateRecord[] = [
  {
    id: "submission_applicant",
    kind: "message",
    name: "Submission confirmation (applicant)",
    description: "Sent when an applicant submits a filing.",
    subject: "We received your filing — {{workflowName}}",
    textBody: [
      "{{greeting}}",
      "",
      "Your {{workflowName}} application was submitted successfully.",
      "",
      "Reference: {{applicationId}}",
      "Submitted: {{submittedAt}}",
      "",
      "View your application: {{dashboardLink}}",
      "",
      "If you have questions, reply to this email.",
    ].join("\n"),
    htmlBody: `<p style="margin:0 0 16px;">{{greeting}}</p>
<p style="margin:0 0 16px;">Your <strong>{{workflowName}}</strong> application was submitted successfully.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;font-size:14px;color:#3f3f46;">
<tr><td style="padding:2px 12px 2px 0;vertical-align:top;"><strong>Reference</strong></td><td>{{applicationId}}</td></tr>
<tr><td style="padding:2px 12px 2px 0;vertical-align:top;"><strong>Submitted</strong></td><td>{{submittedAt}}</td></tr>
</table>
<p style="margin:0 0 16px;"><a href="{{dashboardLink}}" style="color:#1e3a5f;font-weight:600;">View your application</a></p>
<p style="margin:0;font-size:14px;color:#71717a;">If you have questions, reply to this email.</p>`,
    sampleVariables: { ...sharedSampleSubmission },
  },
  {
    id: "submission_admin",
    kind: "message",
    name: "New submission (admin)",
    description: "Alert sent to the admin inbox when a filing is submitted.",
    subject: "[Z.O.A] New submission — {{workflowName}}",
    textBody: [
      "A new filing was submitted.",
      "",
      "Workflow: {{workflowName}} ({{workflowSlug}})",
      "Applicant: {{applicantDisplay}}",
      "Reference: {{applicationId}}",
      "Submitted: {{submittedAt}}",
      "",
      "Review: {{adminLink}}",
    ].join("\n"),
    htmlBody: `<p style="margin:0 0 16px;">A new filing was submitted.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;font-size:14px;color:#3f3f46;">
<tr><td style="padding:2px 12px 2px 0;vertical-align:top;"><strong>Workflow</strong></td><td>{{workflowName}} ({{workflowSlug}})</td></tr>
<tr><td style="padding:2px 12px 2px 0;vertical-align:top;"><strong>Applicant</strong></td><td>{{applicantDisplay}}</td></tr>
<tr><td style="padding:2px 12px 2px 0;vertical-align:top;"><strong>Reference</strong></td><td>{{applicationId}}</td></tr>
<tr><td style="padding:2px 12px 2px 0;vertical-align:top;"><strong>Submitted</strong></td><td>{{submittedAt}}</td></tr>
</table>
<p style="margin:0;"><a href="{{adminLink}}" style="color:#1e3a5f;font-weight:600;">Open in admin inbox</a></p>`,
    sampleVariables: { ...sharedSampleSubmission },
  },
  {
    id: "status_in_review",
    kind: "message",
    name: "Status update — In review",
    description: "Sent when admin moves a filing to in review.",
    subject: "Update on your filing — In review",
    textBody: [
      "{{greeting}}",
      "",
      "Your {{workflowName}} application is now being reviewed by our team.",
      "",
      "Reference: {{applicationId}}",
      "",
      "View your application: {{dashboardLink}}",
    ].join("\n"),
    htmlBody: `<p style="margin:0 0 16px;">{{greeting}}</p>
<p style="margin:0 0 16px;">Your <strong>{{workflowName}}</strong> application is now being reviewed by our team.</p>
<p style="margin:0 0 16px;font-size:14px;"><strong>Reference:</strong> {{applicationId}}</p>
<p style="margin:0;"><a href="{{dashboardLink}}" style="color:#1e3a5f;font-weight:600;">View your application</a></p>`,
    sampleVariables: {
      ...sharedSampleStatus,
      statusLabel: "In review",
    },
  },
  {
    id: "status_needs_info",
    kind: "message",
    name: "Status update — Needs information",
    description: "Sent when admin requests more information (includes team note).",
    subject: "Update on your filing — Needs information",
    textBody: [
      "{{greeting}}",
      "",
      "We need additional information for your {{workflowName}} application.",
      "",
      "Note from our team:",
      "{{adminNote}}",
      "",
      "Reference: {{applicationId}}",
      "",
      "View your application: {{dashboardLink}}",
    ].join("\n"),
    htmlBody: `<p style="margin:0 0 16px;">{{greeting}}</p>
<p style="margin:0 0 16px;">We need additional information for your <strong>{{workflowName}}</strong> application.</p>
<p style="margin:0 0 16px;padding:14px 16px;background:#f4f4f5;border-radius:8px;font-size:14px;"><strong>Note from our team:</strong><br />{{adminNote}}</p>
<p style="margin:0 0 16px;font-size:14px;"><strong>Reference:</strong> {{applicationId}}</p>
<p style="margin:0;"><a href="{{dashboardLink}}" style="color:#1e3a5f;font-weight:600;">View your application</a></p>`,
    sampleVariables: {
      ...sharedSampleStatus,
      statusLabel: "Needs information",
    },
  },
  {
    id: "status_completed",
    kind: "message",
    name: "Status update — Completed",
    description: "Sent when a filing is marked completed.",
    subject: "Update on your filing — Completed",
    textBody: [
      "{{greeting}}",
      "",
      "Your {{workflowName}} application has been completed.",
      "",
      "Reference: {{applicationId}}",
      "",
      "View your application: {{dashboardLink}}",
    ].join("\n"),
    htmlBody: `<p style="margin:0 0 16px;">{{greeting}}</p>
<p style="margin:0 0 16px;">Your <strong>{{workflowName}}</strong> application has been completed.</p>
<p style="margin:0 0 16px;font-size:14px;"><strong>Reference:</strong> {{applicationId}}</p>
<p style="margin:0;"><a href="{{dashboardLink}}" style="color:#1e3a5f;font-weight:600;">View your application</a></p>`,
    sampleVariables: {
      ...sharedSampleStatus,
      statusLabel: "Completed",
    },
  },
  {
    id: "status_rejected",
    kind: "message",
    name: "Status update — Rejected",
    description: "Sent when a filing is rejected.",
    subject: "Update on your filing — Rejected",
    textBody: [
      "{{greeting}}",
      "",
      "Your {{workflowName}} application was not approved.",
      "",
      "Reference: {{applicationId}}",
      "",
      "View your application: {{dashboardLink}}",
      "",
      "If you have questions, reply to this email.",
    ].join("\n"),
    htmlBody: `<p style="margin:0 0 16px;">{{greeting}}</p>
<p style="margin:0 0 16px;">Your <strong>{{workflowName}}</strong> application was not approved.</p>
<p style="margin:0 0 16px;font-size:14px;"><strong>Reference:</strong> {{applicationId}}</p>
<p style="margin:0 0 16px;"><a href="{{dashboardLink}}" style="color:#1e3a5f;font-weight:600;">View your application</a></p>
<p style="margin:0;font-size:14px;color:#71717a;">If you have questions, reply to this email.</p>`,
    sampleVariables: {
      ...sharedSampleStatus,
      statusLabel: "Rejected",
    },
  },
];

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateRecord[] = [
  DEFAULT_EMAIL_LAYOUT,
  ...DEFAULT_EMAIL_MESSAGE_TEMPLATES,
];

const defaultsById = new Map(
  DEFAULT_EMAIL_TEMPLATES.map((t) => [t.id, t] as const),
);

export function getDefaultTemplate(id: string): EmailTemplateRecord | undefined {
  return defaultsById.get(id as EmailTemplateId);
}

export function isEmailMessageTemplateId(
  id: string,
): id is EmailMessageTemplateId {
  return (EMAIL_MESSAGE_TEMPLATE_IDS as readonly string[]).includes(id);
}

export function statusTemplateId(
  status: ApplicationStatus,
): EmailMessageTemplateId | null {
  const map: Partial<Record<ApplicationStatus, EmailMessageTemplateId>> = {
    in_review: "status_in_review",
    needs_info: "status_needs_info",
    completed: "status_completed",
    rejected: "status_rejected",
  };
  return map[status] ?? null;
}

export function isEmailTemplateId(id: string): id is EmailTemplateId {
  return id === EMAIL_LAYOUT_ID || isEmailMessageTemplateId(id);
}
