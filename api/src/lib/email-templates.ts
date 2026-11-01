import type { ApplicationStatus, WorkflowSlug } from "./types";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  needs_info: "Needs information",
  completed: "Completed",
  rejected: "Rejected",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dashboardUrl(appBaseUrl: string, applicationId: string): string {
  const base = appBaseUrl.replace(/\/$/, "");
  return `${base}/applications/${applicationId}`;
}

export type SubmissionEmailInput = {
  applicationId: string;
  workflowName: string;
  workflowSlug: WorkflowSlug;
  submittedAt: string;
  applicantEmail: string;
  applicantName?: string;
  appBaseUrl: string;
};

export function buildSubmissionApplicantEmail(input: SubmissionEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const link = dashboardUrl(input.appBaseUrl, input.applicationId);
  const greeting = input.applicantName
    ? `Hello ${input.applicantName},`
    : "Hello,";
  const subject = `We received your filing — ${input.workflowName}`;
  const text = [
    greeting,
    "",
    `Your ${input.workflowName} application was submitted successfully.`,
    "",
    `Reference: ${input.applicationId}`,
    `Submitted: ${input.submittedAt}`,
    "",
    `View your application: ${link}`,
    "",
    "If you have questions, reply to this email.",
    "",
    "— Z.O.A Filings",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>${escapeHtml(greeting)}</p>
<p>Your <strong>${escapeHtml(input.workflowName)}</strong> application was submitted successfully.</p>
<ul>
<li><strong>Reference:</strong> ${escapeHtml(input.applicationId)}</li>
<li><strong>Submitted:</strong> ${escapeHtml(input.submittedAt)}</li>
</ul>
<p><a href="${escapeHtml(link)}">View your application</a></p>
<p style="color:#555;font-size:14px">If you have questions, reply to this email.</p>
<p>— Z.O.A Filings</p>
</body></html>`;

  return { subject, text, html };
}

export type AdminSubmissionAlertInput = SubmissionEmailInput;

export function buildSubmissionAdminEmail(input: AdminSubmissionAlertInput): {
  subject: string;
  text: string;
  html: string;
} {
  const base = input.appBaseUrl.replace(/\/$/, "");
  const adminLink = `${base}/admin/applications/${input.applicationId}`;
  const subject = `[Z.O.A] New submission — ${input.workflowName}`;
  const applicant = input.applicantName
    ? `${input.applicantName} <${input.applicantEmail}>`
    : input.applicantEmail;

  const text = [
    "A new filing was submitted.",
    "",
    `Workflow: ${input.workflowName} (${input.workflowSlug})`,
    `Applicant: ${applicant}`,
    `Reference: ${input.applicationId}`,
    `Submitted: ${input.submittedAt}`,
    "",
    `Review: ${adminLink}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>A new filing was submitted.</p>
<ul>
<li><strong>Workflow:</strong> ${escapeHtml(input.workflowName)} (${escapeHtml(input.workflowSlug)})</li>
<li><strong>Applicant:</strong> ${escapeHtml(applicant)}</li>
<li><strong>Reference:</strong> ${escapeHtml(input.applicationId)}</li>
<li><strong>Submitted:</strong> ${escapeHtml(input.submittedAt)}</li>
</ul>
<p><a href="${escapeHtml(adminLink)}">Open in admin inbox</a></p>
</body></html>`;

  return { subject, text, html };
}

export type StatusChangeEmailInput = {
  applicationId: string;
  workflowName: string;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  applicantEmail: string;
  applicantName?: string;
  adminNote?: string;
  appBaseUrl: string;
};

export function buildStatusChangeApplicantEmail(
  input: StatusChangeEmailInput,
): { subject: string; text: string; html: string } | null {
  const notifyStatuses: ApplicationStatus[] = [
    "in_review",
    "needs_info",
    "completed",
    "rejected",
  ];
  if (!notifyStatuses.includes(input.newStatus)) {
    return null;
  }

  const label = STATUS_LABELS[input.newStatus];
  const link = dashboardUrl(input.appBaseUrl, input.applicationId);
  const greeting = input.applicantName
    ? `Hello ${input.applicantName},`
    : "Hello,";
  const subject = `Update on your filing — ${label}`;

  const noteBlock =
    input.adminNote && input.newStatus === "needs_info"
      ? [`Note from our team:`, input.adminNote, ""]
      : [];

  const text = [
    greeting,
    "",
    `The status of your ${input.workflowName} application is now: ${label}.`,
    ...noteBlock,
    `Reference: ${input.applicationId}`,
    "",
    `View your application: ${link}`,
    "",
    "— Z.O.A Filings",
  ].join("\n");

  const noteHtml =
    input.adminNote && input.newStatus === "needs_info"
      ? `<p><strong>Note from our team:</strong><br>${escapeHtml(input.adminNote)}</p>`
      : "";

  const html = `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>${escapeHtml(greeting)}</p>
<p>The status of your <strong>${escapeHtml(input.workflowName)}</strong> application is now: <strong>${escapeHtml(label)}</strong>.</p>
${noteHtml}
<p><strong>Reference:</strong> ${escapeHtml(input.applicationId)}</p>
<p><a href="${escapeHtml(link)}">View your application</a></p>
<p>— Z.O.A Filings</p>
</body></html>`;

  return { subject, text, html };
}

export async function sendSubmissionNotifications(
  input: SubmissionEmailInput,
): Promise<void> {
  const { sendTransactionalEmail, getEmailSettings } = await import("./email");
  const settings = getEmailSettings();
  if (!settings.enabled) return;

  const applicant = buildSubmissionApplicantEmail(input);
  await sendTransactionalEmail({
    to: input.applicantEmail,
    ...applicant,
  });

  if (settings.notifyAdminEmail) {
    const admin = buildSubmissionAdminEmail(input);
    await sendTransactionalEmail({
      to: settings.notifyAdminEmail,
      ...admin,
    });
  }
}

export async function sendStatusChangeNotification(
  input: StatusChangeEmailInput,
): Promise<void> {
  const { sendTransactionalEmail, getEmailSettings } = await import("./email");
  const settings = getEmailSettings();
  if (!settings.enabled) return;

  const message = buildStatusChangeApplicantEmail(input);
  if (!message) return;

  await sendTransactionalEmail({
    to: input.applicantEmail,
    ...message,
  });
}
