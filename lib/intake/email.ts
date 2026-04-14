import { outboundEmailDisabled } from '@/lib/email/disabled';

export async function sendMagicLinkEmail(params: {
  to: string;
  companyName: string;
  magicLinkUrl: string;
}): Promise<void> {
  if (outboundEmailDisabled()) {
    console.log(
      '[intake] outbound disabled, would send magic link to',
      params.to,
      params.magicLinkUrl,
    );
    return;
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    console.log('[intake] magic link would send to', params.to, params.magicLinkUrl);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: `Welcome to Raijuu — onboarding for ${params.companyName}`,
      html: renderMagicLinkHtml(params.companyName, params.magicLinkUrl),
      text: renderMagicLinkText(params.companyName, params.magicLinkUrl),
    }),
  });
  if (!res.ok) {
    throw new Error(
      `[intake] magic link send failed ${res.status}: ${await res.text()}`,
    );
  }
}

function renderMagicLinkText(companyName: string, url: string): string {
  return [
    `Hi from Raijuu — excited to get started with ${companyName}.`,
    ``,
    `Next step: spend 10 minutes answering a few questions about your tools, goals, and how we share credentials.`,
    ``,
    `Your onboarding link (expires when you submit):`,
    url,
    ``,
    `—`,
    `Raijuu AI Automation`,
  ].join('\n');
}

function renderMagicLinkHtml(companyName: string, url: string): string {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <h1 style="font-size:20px;margin:0 0 16px">Welcome to Raijuu</h1>
    <p>Excited to get started with <strong>${escapeHtml(companyName)}</strong>.</p>
    <p>Next step: spend ~10 minutes answering a few questions about your tools, goals, and how we share credentials.</p>
    <p style="margin:32px 0"><a href="${escapeAttr(url)}" style="display:inline-block;background:#4d65ff;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">Start onboarding</a></p>
    <p style="color:#555;font-size:12px">Or paste this link into your browser: ${escapeHtml(url)}</p>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#39;',
      })[c]!,
  );
}

function escapeAttr(s: string): string {
  return s.replace(
    /["'<>&]/g,
    (c) =>
      ({
        '"': '&quot;',
        "'": '&#39;',
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
      })[c]!,
  );
}
