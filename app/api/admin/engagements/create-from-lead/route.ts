import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { engagements, leads } from '@/lib/db/schema';
import { buildMagicLinkUrl } from '@/lib/intake/magic-link';
import { sendMagicLinkEmail } from '@/lib/intake/email';

const bodySchema = z.object({
  leadId: z.number().int().positive(),
  companyName: z.string().min(2).max(120),
  monthlyFeeCents: z.number().int().nonnegative().optional(),
});

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)
    ?.role;
  if (role !== 'admin') {
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
    return NextResponse.json(
      { engagementId: engagement.id, emailSent: false, url },
      { status: 207 },
    );
  }

  return NextResponse.json({ engagementId: engagement.id, emailSent: true });
}
