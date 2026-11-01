import type { ApplicationStatus } from "./types";

export const EMAIL_TEMPLATE_SK = "v1";

export const EMAIL_TEMPLATE_IDS = [
  "submission_applicant",
  "submission_admin",
  "status_in_review",
  "status_needs_info",
  "status_completed",
  "status_rejected",
] as const;

export type EmailTemplateId = (typeof EMAIL_TEMPLATE_IDS)[number];

export type EmailTemplateRecord = {
  id: EmailTemplateId;
  name: string;
  description: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  sampleVariables: Record<string, string>;
};

const SAMPLE_APP_ID = "550e8400-e29b-41d4-a716-446655440000";
const SAMPLE_SUBMITTED = "2026-11-01T10:30:00.000Z";
const SAMPLE_BASE = "https://zoa-theta.vercel.app";

const sharedSampleSubmission: Record<string, string> = {
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
  greeting: "Hello Jane Doe,",
  workflowName: "Company limited by shares",
  applicationId: SAMPLE_APP_ID,
  statusLabel: "In review",
  dashboardLink: `${SAMPLE_BASE}/applications/${SAMPLE_APP_ID}`,
  adminNote:
    "Please upload a clearer copy of your identification document.",
};

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateRecord[] = [
  {
    id: "submission_applicant",
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
      "",
      "— Z.O.A Filings",
    ].join("\n"),
    htmlBody: `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>{{greeting}}</p>
<p>Your <strong>{{workflowName}}</strong> application was submitted successfully.</p>
<ul>
<li><strong>Reference:</strong> {{applicationId}}</li>
<li><strong>Submitted:</strong> {{submittedAt}}</li>
</ul>
<p><a href="{{dashboardLink}}">View your application</a></p>
<p style="color:#555;font-size:14px">If you have questions, reply to this email.</p>
<p>— Z.O.A Filings</p>
</body></html>`,
    sampleVariables: { ...sharedSampleSubmission },
  },
  {
    id: "submission_admin",
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
    htmlBody: `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>A new filing was submitted.</p>
<ul>
<li><strong>Workflow:</strong> {{workflowName}} ({{workflowSlug}})</li>
<li><strong>Applicant:</strong> {{applicantDisplay}}</li>
<li><strong>Reference:</strong> {{applicationId}}</li>
<li><strong>Submitted:</strong> {{submittedAt}}</li>
</ul>
<p><a href="{{adminLink}}">Open in admin inbox</a></p>
</body></html>`,
    sampleVariables: { ...sharedSampleSubmission },
  },
  {
    id: "status_in_review",
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
      "",
      "— Z.O.A Filings",
    ].join("\n"),
    htmlBody: `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>{{greeting}}</p>
<p>Your <strong>{{workflowName}}</strong> application is now being reviewed by our team.</p>
<p><strong>Reference:</strong> {{applicationId}}</p>
<p><a href="{{dashboardLink}}">View your application</a></p>
<p>— Z.O.A Filings</p>
</body></html>`,
    sampleVariables: {
      ...sharedSampleStatus,
      statusLabel: "In review",
    },
  },
  {
    id: "status_needs_info",
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
      "",
      "— Z.O.A Filings",
    ].join("\n"),
    htmlBody: `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>{{greeting}}</p>
<p>We need additional information for your <strong>{{workflowName}}</strong> application.</p>
<p><strong>Note from our team:</strong><br>{{adminNote}}</p>
<p><strong>Reference:</strong> {{applicationId}}</p>
<p><a href="{{dashboardLink}}">View your application</a></p>
<p>— Z.O.A Filings</p>
</body></html>`,
    sampleVariables: {
      ...sharedSampleStatus,
      statusLabel: "Needs information",
    },
  },
  {
    id: "status_completed",
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
      "",
      "— Z.O.A Filings",
    ].join("\n"),
    htmlBody: `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>{{greeting}}</p>
<p>Your <strong>{{workflowName}}</strong> application has been completed.</p>
<p><strong>Reference:</strong> {{applicationId}}</p>
<p><a href="{{dashboardLink}}">View your application</a></p>
<p>— Z.O.A Filings</p>
</body></html>`,
    sampleVariables: {
      ...sharedSampleStatus,
      statusLabel: "Completed",
    },
  },
  {
    id: "status_rejected",
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
      "",
      "— Z.O.A Filings",
    ].join("\n"),
    htmlBody: `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>{{greeting}}</p>
<p>Your <strong>{{workflowName}}</strong> application was not approved.</p>
<p><strong>Reference:</strong> {{applicationId}}</p>
<p><a href="{{dashboardLink}}">View your application</a></p>
<p style="color:#555;font-size:14px">If you have questions, reply to this email.</p>
<p>— Z.O.A Filings</p>
</body></html>`,
    sampleVariables: {
      ...sharedSampleStatus,
      statusLabel: "Rejected",
    },
  },
];

const defaultsById = new Map(
  DEFAULT_EMAIL_TEMPLATES.map((t) => [t.id, t] as const),
);

export function getDefaultTemplate(id: string): EmailTemplateRecord | undefined {
  return defaultsById.get(id as EmailTemplateId);
}

export function statusTemplateId(
  status: ApplicationStatus,
): EmailTemplateId | null {
  const map: Partial<Record<ApplicationStatus, EmailTemplateId>> = {
    in_review: "status_in_review",
    needs_info: "status_needs_info",
    completed: "status_completed",
    rejected: "status_rejected",
  };
  return map[status] ?? null;
}

export function isEmailTemplateId(id: string): id is EmailTemplateId {
  return (EMAIL_TEMPLATE_IDS as readonly string[]).includes(id);
}
