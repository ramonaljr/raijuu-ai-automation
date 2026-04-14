'use server';

import { db } from '@/lib/db';
import { engagements, intakeSubmissions } from '@/lib/db/schema';
import { intakeSubmissionSchema } from '@/lib/intake/schema';
import { verifyMagicLink } from '@/lib/intake/magic-link';
import { outboundEmailDisabled } from '@/lib/email/disabled';
import { eq } from 'drizzle-orm';

export type SubmitIntakeResult =
  | { ok: true }
  | { ok: false; error: 'unauthorized' | 'invalid' | 'server' | 'already-submitted' };

export async function submitIntake(formData: FormData): Promise<SubmitIntakeResult> {
  const engagementId = Number(formData.get('engagementId'));
  const token = String(formData.get('token') ?? '');
  const payloadRaw = String(formData.get('payload') ?? '');
  if (!Number.isInteger(engagementId) || engagementId <= 0) return { ok: false, error: 'invalid' };

  const check = await verifyMagicLink(engagementId, token);
  if (!check.ok) {
    return { ok: false, error: check.reason === 'already-submitted' ? 'already-submitted' : 'unauthorized' };
  }

  let parsed;
  try {
    parsed = intakeSubmissionSchema.safeParse(JSON.parse(payloadRaw));
  } catch {
    return { ok: false, error: 'invalid' };
  }
  if (!parsed.success) return { ok: false, error: 'invalid' };

  // Note: neon-http driver doesn't support db.transaction(). Run sequentially.
  // Worst case on a partial failure is an orphaned intake_submission row with
  // engagement.status still 'onboarding' — recoverable, and the
  // verifyMagicLink 'already-submitted' check still gates re-submits because
  // we flip status only after the insert succeeds.
  try {
    await db.insert(intakeSubmissions).values({
      engagementId,
      toolsJson: { tools: parsed.data.tools, customTools: parsed.data.customTools ?? '' },
      credentialsVaultRef: parsed.data.credentialsVaultUrl ?? null,
      goalsText: parsed.data.goals.join('\n\n'),
      constraintsText: parsed.data.constraints ?? null,
    });
    await db
      .update(engagements)
      .set({ status: 'active' })
      .where(eq(engagements.id, engagementId));
  } catch (err) {
    console.error('[intake] submit failed', err);
    return { ok: false, error: 'server' };
  }

  // Fire-and-forget admin notification
  notifyAdminOfIntake({ engagementId, companyName: parsed.data.companyName }).catch((e) =>
    console.error('[intake] notify failed', e),
  );

  return { ok: true };
}

async function notifyAdminOfIntake(params: { engagementId: number; companyName: string }) {
  if (outboundEmailDisabled()) {
    console.log('[intake] outbound disabled, would notify admin of', params);
    return;
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.RESEND_ADMIN_EMAIL;
  if (!apiKey || !from || !to) {
    console.log('[intake] admin notif skipped (env missing)', params);
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      subject: `Intake complete: ${params.companyName} (engagement #${params.engagementId})`,
      text: `${params.companyName} just submitted intake. Engagement ID: ${params.engagementId}.`,
    }),
  });
}
