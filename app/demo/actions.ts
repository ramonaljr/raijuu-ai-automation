'use server';

import { randomUUID } from 'node:crypto';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { demoSubmissionSchema } from '@/lib/demo/submission';
import { checkRateLimit, hashIp } from '@/lib/demo/rate-limit';
import { verifyTurnstile } from '@/lib/demo/turnstile';
import { notifyAdminOfLead } from '@/lib/demo/resend';

export type SubmitDemoResult =
  | { ok: true; resultKey: string; industry: string }
  | { ok: false; error: 'rate-limited' | 'bot' | 'invalid' | 'server' };

export async function submitDemo(formData: FormData): Promise<SubmitDemoResult> {
  const raw = {
    email: String(formData.get('email') ?? ''),
    industry: String(formData.get('industry') ?? ''),
    situationText: String(formData.get('situationText') ?? ''),
    turnstileToken: formData.get('turnstileToken') ? String(formData.get('turnstileToken')) : undefined,
  };
  const parsed = demoSubmissionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? '0.0.0.0';
  const ipH = await hashIp(ip);
  const rl = checkRateLimit(ipH);
  if (!rl.ok) return { ok: false, error: 'rate-limited' };

  const turnstileOk = await verifyTurnstile(parsed.data.turnstileToken);
  if (!turnstileOk) return { ok: false, error: 'bot' };

  const resultKey = randomUUID();

  try {
    await db.insert(leads).values({
      email: parsed.data.email,
      industry: parsed.data.industry,
      situationText: parsed.data.situationText,
      demoResultKey: resultKey,
      ipHash: ipH,
      turnstileVerified: Boolean(parsed.data.turnstileToken),
      source: 'demo',
    });
  } catch (err) {
    console.error('[demo] insert failed', err);
    return { ok: false, error: 'server' };
  }

  notifyAdminOfLead({
    email: parsed.data.email,
    industry: parsed.data.industry,
    situationText: parsed.data.situationText,
  }).catch((e) => console.error('[demo] notify failed', e));

  return { ok: true, resultKey, industry: parsed.data.industry };
}
