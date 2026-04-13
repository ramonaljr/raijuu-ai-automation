type AdminNotification = {
  email: string;
  industry: string;
  situationText: string;
};

export async function notifyAdminOfLead(submission: AdminNotification): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.RESEND_ADMIN_EMAIL;
  if (!apiKey || !from || !to) {
    console.log('[resend] skipped (env not set):', submission.email);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      subject: `New Raijuu demo lead: ${submission.email}`,
      text: `Industry: ${submission.industry}\n\nSituation:\n${submission.situationText}`,
    }),
  });
  if (!res.ok) {
    console.error('[resend] failed', res.status, await res.text());
    // Don't throw — lead is already saved; email is best-effort.
  }
}
