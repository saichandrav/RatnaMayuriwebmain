const getResendApiKey = () => {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY must be set");
  }

  return apiKey;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const apiKey = getResendApiKey();
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
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html,
        reply_to: supportEmail,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = result?.message || result?.error || `Resend request failed with ${response.status}`;
      console.error("Resend API returned an error", result);
      throw new Error(errorMessage);
    }

    if (!result?.id) {
      console.error("Unexpected Resend response", result);
      throw new Error("Email delivery failed");
    }
  } catch (error) {
    console.error("Failed to send email via Resend", error);
    throw new Error("Email delivery failed");
  }
};
