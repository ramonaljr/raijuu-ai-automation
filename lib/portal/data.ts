import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  engagements,
  automations,
  runs,
  outcomesMonthly,
} from '@/lib/db/schema';

export async function getEngagementByClerkUserId(userId: string) {
  const [row] = await db
    .select()
    .from(engagements)
    .where(eq(engagements.clerkUserId, userId))
    .limit(1);
  return row ?? null;
}

export async function listAutomationsForEngagement(engagementId: number) {
  return db
    .select()
    .from(automations)
    .where(eq(automations.engagementId, engagementId))
    .orderBy(desc(automations.createdAt))
    .limit(50);
}

export async function listRecentRunsForEngagement(engagementId: number) {
  return db
    .select({
      id: runs.id,
      automationId: runs.automationId,
      automationName: automations.name,
      startedAt: runs.startedAt,
      finishedAt: runs.finishedAt,
      status: runs.status,
      outcomeJson: runs.outcomeJson,
    })
    .from(runs)
    .innerJoin(automations, eq(automations.id, runs.automationId))
    .where(eq(automations.engagementId, engagementId))
    .orderBy(desc(runs.startedAt))
    .limit(30);
}

export async function getRunForEngagement(
  engagementId: number,
  runId: number,
) {
  const [row] = await db
    .select({
      id: runs.id,
      automationId: runs.automationId,
      automationName: automations.name,
      startedAt: runs.startedAt,
      finishedAt: runs.finishedAt,
      status: runs.status,
      outcomeJson: runs.outcomeJson,
      n8nExecutionId: runs.n8nExecutionId,
    })
    .from(runs)
    .innerJoin(automations, eq(automations.id, runs.automationId))
    .where(
      and(eq(automations.engagementId, engagementId), eq(runs.id, runId)),
    )
    .limit(1);
  return row ?? null;
}

export async function getLastRunForEngagement(engagementId: number) {
  const [row] = await db
    .select({
      id: runs.id,
      automationId: runs.automationId,
      automationName: automations.name,
      startedAt: runs.startedAt,
      finishedAt: runs.finishedAt,
      status: runs.status,
      outcomeJson: runs.outcomeJson,
    })
    .from(runs)
    .innerJoin(automations, eq(automations.id, runs.automationId))
    .where(eq(automations.engagementId, engagementId))
    .orderBy(desc(runs.startedAt))
    .limit(1);
  return row ?? null;
}

export function currentUtcMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function getCurrentMonthOutcome(engagementId: number) {
  const month = currentUtcMonth();
  return getOutcomeForMonth(engagementId, month);
}

export async function getOutcomeForMonth(
  engagementId: number,
  month: string,
) {
  const [row] = await db
    .select()
    .from(outcomesMonthly)
    .where(
      and(
        eq(outcomesMonthly.engagementId, engagementId),
        eq(outcomesMonthly.month, month),
      ),
    )
    .limit(1);
  return { month, outcome: row ?? null };
}

export async function listMonthsWithOutcomes(
  engagementId: number,
): Promise<string[]> {
  const rows = await db
    .select({ month: outcomesMonthly.month })
    .from(outcomesMonthly)
    .where(eq(outcomesMonthly.engagementId, engagementId))
    .orderBy(desc(outcomesMonthly.month));
  return rows.map((r) => r.month);
}
