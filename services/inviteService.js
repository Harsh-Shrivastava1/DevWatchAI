async function sendInvitationEmail({ email, inviterName, workspaceName, inviteUrl, role }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    const error = new Error(
      "Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM."
    );
    error.status = 503;
    throw error;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: `${inviterName} invited you to ${workspaceName} on DevWatch AI`,
      html: [
        `<p>${escapeHtml(inviterName)} invited you to join <strong>${escapeHtml(workspaceName)}</strong> as ${escapeHtml(role)}.</p>`,
        `<p><a href="${escapeHtml(inviteUrl)}">Accept invitation</a></p>`,
        "<p>This secure invitation expires in seven days.</p>"
      ].join("")
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || "Invitation email could not be sent.");
    error.status = 502;
    throw error;
  }

  return payload;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = { sendInvitationEmail };
