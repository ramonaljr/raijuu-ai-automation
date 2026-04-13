import { sql, and, eq, gte, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { runs, automations, outcomesMonthly } from '@/lib/db/schema';

export type MonthSpec = { year: number; monthIndex: number };

export function previousMonth(now: Date = new Date()): MonthSpec {
  const year = now.getUTCFullYear();
  const monthIndex = now.getUTCMonth();
  if (monthIndex === 0) return { year: year - 1, monthIndex: 11 };
  return { year, monthIndex: monthIndex - 1 };
}

export function monthLabel(spec: MonthSpec): string {
  return `${spec.year}-${String(spec.monthIndex + 1).padStart(2, '0')}`;
}

export type AggregateSummary = {
  month: string;
  upserts: number;
};

export async function aggregateMonth(spec: MonthSpec): Promise<AggregateSummary> {
  const monthStart = new Date(Date.UTC(spec.year, spec.monthIndex, 1));
  const monthEnd = new Date(Date.UTC(spec.year, spec.monthIndex + 1, 1));
  const month = monthLabel(spec);

  const grouped = await db
    .select({
      engagementId: automations.engagementId,
      runsCount: sql<number>`count(${runs.id})::int`,
      timeSavedMinutes: sql<number>`coalesce(sum((${runs.outcomeJson}->>'time_saved_minutes')::int), 0)::int`,
      dollarsInfluencedCents: sql<number>`coalesce(sum((${runs.outcomeJson}->>'dollars_influenced_cents')::int), 0)::int`,
    })
    .from(runs)
    .innerJoin(automations, eq(automations.id, runs.automationId))
    .where(and(gte(runs.startedAt, monthStart), lt(runs.startedAt, monthEnd)))
    .groupBy(automations.engagementId);

  let upserts = 0;
  for (const row of grouped) {
    await db
      .insert(outcomesMonthly)
      .values({
        engagementId: row.engagementId,
        month,
        runsCount: row.runsCount,
        timeSavedMinutes: row.timeSavedMinutes,
        dollarsInfluencedCents: row.dollarsInfluencedCents,
      })
      .onConflictDoUpdate({
        target: [outcomesMonthly.engagementId, outcomesMonthly.month],
        set: {
          runsCount: row.runsCount,
          timeSavedMinutes: row.timeSavedMinutes,
          dollarsInfluencedCents: row.dollarsInfluencedCents,
        },
      });
    upserts++;
  }

  return { month, upserts };
}
