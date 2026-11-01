import {
  SendEmailCommand,
  SESv2Client,
  type SendEmailCommandInput,
} from "@aws-sdk/client-sesv2";
import nodemailer from "nodemailer";

export type EmailSettings = {
  enabled: boolean;
  transport: "ses" | "smtp" | "none";
  from: string;
  replyTo?: string;
  notifyAdminEmail?: string;
  appBaseUrl: string;
};

export function getEmailSettings(): EmailSettings {
  const enabledRaw = process.env.EMAIL_ENABLED;
  const enabled = enabledRaw === "true";

  const transportRaw = (process.env.EMAIL_TRANSPORT ?? "ses").toLowerCase();
  const transport: EmailSettings["transport"] =
    transportRaw === "smtp"
      ? "smtp"
      : transportRaw === "none"
        ? "none"
        : "ses";

  return {
    enabled: enabled && transport !== "none",
    transport,
    from:
      process.env.EMAIL_FROM ??
      "Z.O.A Filings <filings@mail.zaynababdussalam.com>",
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    notifyAdminEmail: process.env.NOTIFY_ADMIN_EMAIL || undefined,
    appBaseUrl:
      process.env.APP_BASE_URL ?? "https://zoa-theta.vercel.app",
  };
}

let sesClient: SESv2Client | undefined;

function getSesClient(): SESv2Client {
  if (!sesClient) {
    sesClient = new SESv2Client({});
  }
  return sesClient;
}

export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendTransactionalEmail(
  message: OutboundEmail,
): Promise<void> {
  const settings = getEmailSettings();
  if (!settings.enabled) {
    return;
  }

  if (settings.transport === "smtp") {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "127.0.0.1",
      port: Number(process.env.SMTP_PORT ?? "1025"),
      secure: false,
    });
    await transport.sendMail({
      from: settings.from,
      to: message.to,
      replyTo: settings.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return;
  }

  const input: SendEmailCommandInput = {
    FromEmailAddress: settings.from,
    Destination: { ToAddresses: [message.to] },
    ReplyToAddresses: settings.replyTo ? [settings.replyTo] : undefined,
    Content: {
      Simple: {
        Subject: { Data: message.subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: message.text, Charset: "UTF-8" },
          Html: { Data: message.html, Charset: "UTF-8" },
        },
      },
    },
  };

  await getSesClient().send(new SendEmailCommand(input));
}

/** Best-effort send; logs errors without throwing to callers. */
export function sendTransactionalEmailSafe(message: OutboundEmail): void {
  sendTransactionalEmail(message).catch((err) => {
    console.error("Transactional email failed", {
      to: message.to,
      subject: message.subject,
      err,
    });
  });
}
