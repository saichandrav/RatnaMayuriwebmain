import nodemailer from "nodemailer";

const getMailTransport = () => {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 0);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be set");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const transport = getMailTransport();
  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim();

  if (!to || !subject) {
    throw new Error("Email 'to' and 'subject' are required");
  }

  if (!text && !html) {
    throw new Error("Email 'text' or 'html' content is required");
  }

  if (!from) {
    throw new Error("SMTP_FROM or SMTP_USER must be set");
  }

  try {
    await transport.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("Failed to send email via SMTP", error);
    throw new Error("Email delivery failed");
  }
};
