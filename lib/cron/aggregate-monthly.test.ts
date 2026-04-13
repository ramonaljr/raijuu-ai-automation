import { describe, it, expect } from 'vitest';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { engagements, leads, automations, runs, outcomesMonthly } from '@/lib/db/schema';
import { aggregateMonth, previousMonth, monthLabel } from './aggregate-monthly';

describe('previousMonth', () => {
  it('returns prior month within same year', () => {
    const spec = previousMonth(new Date(Date.UTC(2026, 5, 15))); // June
    expect(spec).toEqual({ year: 2026, monthIndex: 4 });
  });
  it('wraps to december of prior year in january', () => {
    const spec = previousMonth(new Date(Date.UTC(2026, 0, 15)));
    expect(spec).toEqual({ year: 2025, monthIndex: 11 });
  });
});

describe('monthLabel', () => {
  it('zero-pads single-digit months', () => {
    expect(monthLabel({ year: 2026, monthIndex: 0 })).toBe('2026-01');
    expect(monthLabel({ year: 2026, monthIndex: 11 })).toBe('2026-12');
  });
});

describe('aggregateMonth', () => {
  it('aggregates a month of runs into outcomes_monthly', async () => {
    const stamp = Date.now();
    const [lead] = await db.insert(leads).values({
      email: `agg-${stamp}@raijuu.test`,
      industry: 'test',
      situationText: 'seed',
    }).returning();
    const [eng] = await db.insert(engagements).values({
      leadId: lead.id,
      companyName: `Agg Test ${stamp}`,
    }).returning();
    const [auto] = await db.insert(automations).values({
      engagementId: eng.id,
      name: 'Agg Test Automation',
    }).returning();

    // Pick a month well in the past so we don't collide with cron runs
    const spec = { year: 2024, monthIndex: 5 }; // June 2024
    const inMonth = new Date(Date.UTC(2024, 5, 10));
    const outOfMonth = new Date(Date.UTC(2024, 6, 1));

    await db.insert(runs).values([
      {
        automationId: auto.id,
        startedAt: inMonth,
        status: 'success',
        outcomeJson: { time_saved_minutes: 30, dollars_influenced_cents: 5000 },
        n8nExecutionId: `exec-agg-${stamp}-1`,
      },
      {
        automationId: auto.id,
        startedAt: inMonth,
        status: 'success',
        outcomeJson: { time_saved_minutes: 15, dollars_influenced_cents: 2500 },
        n8nExecutionId: `exec-agg-${stamp}-2`,
      },
      {
        automationId: auto.id,
        startedAt: outOfMonth,
        status: 'success',
        outcomeJson: { time_saved_minutes: 999 },
        n8nExecutionId: `exec-agg-${stamp}-3`,
      },
    ]);

    const summary = await aggregateMonth(spec);
    expect(summary.month).toBe('2024-06');
    expect(summary.upserts).toBe(1);

    const [outcome] = await db
      .select()
      .from(outcomesMonthly)
      .where(and(
        eq(outcomesMonthly.engagementId, eng.id),
        eq(outcomesMonthly.month, '2024-06'),
      ))
      .limit(1);

    expect(outcome.runsCount).toBe(2);
    expect(outcome.timeSavedMinutes).toBe(45);
    expect(outcome.dollarsInfluencedCents).toBe(7500);

    // Idempotent re-run produces the same result
    const summary2 = await aggregateMonth(spec);
    expect(summary2.upserts).toBe(1);
    const [outcome2] = await db
      .select()
      .from(outcomesMonthly)
      .where(and(
        eq(outcomesMonthly.engagementId, eng.id),
        eq(outcomesMonthly.month, '2024-06'),
      ))
      .limit(1);
    expect(outcome2.runsCount).toBe(2);

    // Cleanup
    await db.delete(outcomesMonthly).where(eq(outcomesMonthly.engagementId, eng.id));
    await db.delete(runs).where(eq(runs.automationId, auto.id));
    await db.delete(automations).where(eq(automations.id, auto.id));
    await db.delete(engagements).where(eq(engagements.id, eng.id));
    await db.delete(leads).where(eq(leads.id, lead.id));
  }, 30_000);
});
