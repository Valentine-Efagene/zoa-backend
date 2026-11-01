import nodemailer from "nodemailer";

function smtpConfig() {
  return {
    host: process.env.SMTP_HOST ?? "127.0.0.1",
    port: Number(process.env.SMTP_PORT ?? "1025"),
    secure: false,
  };
}

export async function sendMockAuthEmail(to: string, subject: string, text: string) {
  const transport = nodemailer.createTransport(smtpConfig());
  await transport.sendMail({
    from: process.env.MOCK_AUTH_FROM ?? "zoa-uat@localhost",
    to,
    subject,
    text,
  });
}
