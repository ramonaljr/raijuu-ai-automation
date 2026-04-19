import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { engagements, leads } from '@/lib/db/schema';
import { buildMagicLinkUrl } from '@/lib/intake/magic-link';
import { sendMagicLinkEmail } from '@/lib/intake/email';
import { getRole } from '@/lib/auth/roles';

const bodySchema = z.object({
  leadId: z.number().int().positive(),
  companyName: z.string().min(2).max(120),
  monthlyFeeCents: z.number().int().nonnegative().optional(),
});

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (getRole(user) !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const leadRows = await db
    .select()
    .from(leads)
    .where(eq(leads.id, parsed.data.leadId))
    .limit(1);
  const lead = leadRows[0];
  if (!lead) {
    return NextResponse.json({ error: 'lead-not-found' }, { status: 404 });
  }

  const existingRows = await db
    .select({ id: engagements.id, status: engagements.status })
    .from(engagements)
    .where(eq(engagements.leadId, lead.id))
    .limit(1);
  const existing = existingRows[0];
  if (existing) {
    return NextResponse.json(
      {
        error: 'already-converted',
        engagementId: existing.id,
        status: existing.status,
      },
      { status: 409 },
    );
  }

  const [engagement] = await db
    .insert(engagements)
    .values({
      leadId: lead.id,
      companyName: parsed.data.companyName,
      monthlyFeeCents: parsed.data.monthlyFeeCents,
    })
    .returning();

  const baseUrl = process.env.APP_BASE_URL ?? new URL(req.url).origin;
  const url = buildMagicLinkUrl(baseUrl, engagement.id, engagement.magicLinkToken);

  try {
    await sendMagicLinkEmail({
      to: lead.email,
      companyName: parsed.data.companyName,
      magicLinkUrl: url,
    });
  } catch (err) {
    console.error(
      '[intake] send failed; engagement created but link not delivered',
      err,
    );
    Sentry.captureException(err, {
      tags: { route: 'admin/engagements/create-from-lead' },
      extra: { engagementId: engagement.id, leadId: lead.id },
    });
    return NextResponse.json(
      { engagementId: engagement.id, emailSent: false, url },
      { status: 207 },
    );
  }

  return NextResponse.json({ engagementId: engagement.id, emailSent: true });
}
