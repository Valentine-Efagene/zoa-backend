import type { ApplicationStatus } from "./types";
import {
  EMAIL_LAYOUT_ID,
  getDefaultTemplate,
  statusTemplateId,
  type EmailMessageTemplateId,
} from "./email-template-defaults";
import { getEmailLayout, getEmailTemplate } from "./email-template-repository";
import {
  buildVariablesForStatus,
  buildVariablesForSubmission,
  composeTemplatedEmail,
  renderLayoutPreview,
  type StatusVariableInput,
  type SubmissionVariableInput,
} from "./email-template-render";
import { getEmailSettings } from "./email";

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

async function renderStoredMessage(
  templateId: EmailMessageTemplateId,
  variables: Record<string, string>,
  appBaseUrl: string,
): Promise<{ subject: string; text: string; html: string }> {
  const [message, layout] = await Promise.all([
    getEmailTemplate(templateId),
    getEmailLayout(),
  ]);
  return composeTemplatedEmail(message, layout, variables, appBaseUrl);
}

export async function sendSubmissionNotifications(
  input: SubmissionEmailInput,
): Promise<void> {
  const { sendTransactionalEmail, getEmailSettings } = await import("./email");
  const settings = getEmailSettings();
  if (!settings.enabled) return;

  const variables = buildVariablesForSubmission(input);

  const applicant = await renderStoredMessage(
    "submission_applicant",
    variables,
    settings.appBaseUrl,
  );
  await sendTransactionalEmail({
    to: input.applicantEmail,
    subject: applicant.subject,
    text: applicant.text,
    html: applicant.html,
  });

  if (settings.notifyAdminEmail) {
    const admin = await renderStoredMessage(
      "submission_admin",
      variables,
      settings.appBaseUrl,
    );
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

  const message = await renderStoredMessage(
    templateId,
    variables,
    settings.appBaseUrl,
  );
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
  const settings = getEmailSettings();
  const appBaseUrl = settings.appBaseUrl;

  if (templateId === EMAIL_LAYOUT_ID) {
    const layout = await getEmailLayout();
    const variables = {
      ...layout.sampleVariables,
      ...variableOverrides,
    };
    const rendered = renderLayoutPreview(layout, variables, appBaseUrl);
    return {
      subject: "(Layout — no subject line)",
      ...rendered,
    };
  }

  if (!getDefaultTemplate(templateId)) {
    throw new Error("Unknown template id");
  }

  const template = await getEmailTemplate(
    templateId as EmailMessageTemplateId,
  );
  const layout = await getEmailLayout();
  const variables = {
    ...template.sampleVariables,
    ...variableOverrides,
  };
  return composeTemplatedEmail(template, layout, variables, appBaseUrl);
}
