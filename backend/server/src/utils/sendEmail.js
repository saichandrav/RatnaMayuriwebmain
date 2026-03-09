import { Resend } from "resend";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY must be set");
  }

  return new Resend(apiKey);
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const resend = getResendClient();
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || "suportratnamayuri@gmail.com";
  const from = process.env.EMAIL_FROM?.trim() || supportEmail;

  if (!to || !subject) {
    throw new Error("Email 'to' and 'subject' are required");
  }

  if (!text && !html) {
    throw new Error("Email 'text' or 'html' content is required");
  }

  if (!from) {
    throw new Error("EMAIL_FROM or SUPPORT_EMAIL must be set");
  }

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
      replyTo: supportEmail,
    });

    if (result?.error) {
      console.error("Resend API returned an error", result.error);
      throw new Error(result.error.message || "Email delivery failed");
    }
  } catch (error) {
    console.error("Failed to send email via Resend", error);
    throw new Error("Email delivery failed");
  }
};
