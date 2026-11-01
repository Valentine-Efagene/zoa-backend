import type { ApplicationStatus, WorkflowSlug } from "./types";
import { getDefaultTemplate, statusTemplateId } from "./email-template-defaults";
import { getEmailTemplate } from "./email-template-repository";
import {
  buildVariablesForStatus,
  buildVariablesForSubmission,
  renderEmailTemplate,
  type StatusVariableInput,
  type SubmissionVariableInput,
} from "./email-template-render";

export type SubmissionEmailInput = SubmissionVariableInput & {
  applicantEmail: string;
};

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

async function renderStoredTemplate(
  templateId: string,
  variables: Record<string, string>,
): Promise<{ subject: string; text: string; html: string }> {
  const fromDb = await getEmailTemplate(
    templateId as Parameters<typeof getEmailTemplate>[0],
  );
  return renderEmailTemplate(
    fromDb.subject,
    fromDb.textBody,
    fromDb.htmlBody,
    variables,
  );
}

export async function sendSubmissionNotifications(
  input: SubmissionEmailInput,
): Promise<void> {
  const { sendTransactionalEmail, getEmailSettings } = await import("./email");
  const settings = getEmailSettings();
  if (!settings.enabled) return;

  const variables = buildVariablesForSubmission(input);

  const applicant = await renderStoredTemplate(
    "submission_applicant",
    variables,
  );
  await sendTransactionalEmail({
    to: input.applicantEmail,
    subject: applicant.subject,
    text: applicant.text,
    html: applicant.html,
  });

  if (settings.notifyAdminEmail) {
    const admin = await renderStoredTemplate("submission_admin", variables);
    await sendTransactionalEmail({
      to: settings.notifyAdminEmail,
      subject: admin.subject,
      text: admin.text,
      html: admin.html,
    });
  }
}

export async function sendStatusChangeNotification(
  input: StatusChangeEmailInput,
): Promise<void> {
  const { sendTransactionalEmail, getEmailSettings } = await import("./email");
  const settings = getEmailSettings();
  if (!settings.enabled) return;

  const templateId = statusTemplateId(input.newStatus);
  if (!templateId) return;

  const variables = buildVariablesForStatus({
    applicationId: input.applicationId,
    workflowName: input.workflowName,
    newStatus: input.newStatus,
    applicantName: input.applicantName,
    adminNote: input.adminNote,
    appBaseUrl: input.appBaseUrl,
  });

  const message = await renderStoredTemplate(templateId, variables);
  await sendTransactionalEmail({
    to: input.applicantEmail,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

export async function previewEmailTemplate(
  templateId: string,
  variableOverrides?: Record<string, string>,
): Promise<{ subject: string; text: string; html: string }> {
  if (!getDefaultTemplate(templateId)) {
    throw new Error("Unknown template id");
  }
  const template = await getEmailTemplate(
    templateId as Parameters<typeof getEmailTemplate>[0],
  );
  const variables = {
    ...template.sampleVariables,
    ...variableOverrides,
  };
  return renderEmailTemplate(
    template.subject,
    template.textBody,
    template.htmlBody,
    variables,
  );
}
