'use server';

import { currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { engagements, outcomesMonthly } from '@/lib/db/schema';
import { getRole } from '@/lib/auth/roles';
import {
  aggregateMonthForEngagement,
  currentMonthSpec,
} from '@/lib/cron/aggregate-monthly';

const saveSchema = z.object({
  engagementId: z.number().int().positive(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM'),
  narrativeMd: z.string().max(8000),
});

export type SaveNarrativeResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveNarrative(
  input: unknown,
): Promise<SaveNarrativeResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: 'not-signed-in' };
  if (getRole(user) !== 'admin') return { ok: false, error: 'forbidden' };

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid-payload' };

  const { engagementId, month, narrativeMd } = parsed.data;

  const engagementRows = await db
    .select({ id: engagements.id })
    .from(engagements)
    .where(eq(engagements.id, engagementId))
    .limit(1);
  if (!engagementRows[0]) return { ok: false, error: 'engagement-not-found' };

  const existing = await db
    .select({ id: outcomesMonthly.id })
    .from(outcomesMonthly)
    .where(
      and(
        eq(outcomesMonthly.engagementId, engagementId),
        eq(outcomesMonthly.month, month),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(outcomesMonthly)
      .set({ narrativeMd: narrativeMd.length > 0 ? narrativeMd : null })
      .where(eq(outcomesMonthly.id, existing[0].id));
  } else {
    await db.insert(outcomesMonthly).values({
      engagementId,
      month,
      narrativeMd: narrativeMd.length > 0 ? narrativeMd : null,
    });
  }

  revalidatePath(`/admin/clients/${engagementId}`);
  revalidatePath('/app/reports');
  return { ok: true };
}

const recomputeSchema = z.object({
  engagementId: z.number().int().positive(),
});

export type RecomputeResult =
  | { ok: true; month: string }
  | { ok: false; error: string };

export async function recomputeCurrentMonth(
  input: unknown,
): Promise<RecomputeResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: 'not-signed-in' };
  if (getRole(user) !== 'admin') return { ok: false, error: 'forbidden' };

  const parsed = recomputeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid-payload' };

  const engagementRows = await db
    .select({ id: engagements.id })
    .from(engagements)
    .where(eq(engagements.id, parsed.data.engagementId))
    .limit(1);
  if (!engagementRows[0]) return { ok: false, error: 'engagement-not-found' };

  const summary = await aggregateMonthForEngagement(
    parsed.data.engagementId,
    currentMonthSpec(),
  );

  revalidatePath(`/admin/clients/${parsed.data.engagementId}`);
  revalidatePath('/app/reports');
  return { ok: true, month: summary.month };
}
