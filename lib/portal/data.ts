import { and, desc, eq, gte, sql } from 'drizzle-orm';
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

export type LiveMonthSnapshot = {
  runsCount: number;
  successCount: number;
  failureCount: number;
  successRate: number | null; // 0-1, null if no completed runs
  distinctAutomations: number;
  lastSuccessAt: Date | null;
};

export async function getLiveMonthSnapshot(
  engagementId: number,
  month: string,
): Promise<LiveMonthSnapshot> {
  // month is YYYY-MM, UTC. Window is [first-of-month, first-of-next-month).
  const [yStr, mStr] = month.split('-');
  const year = Number(yStr);
  const monthNum = Number(mStr);
  const from = new Date(Date.UTC(year, monthNum - 1, 1));
  const to = new Date(Date.UTC(year, monthNum, 1));

  const rows = await db
    .select({
      status: runs.status,
      automationId: runs.automationId,
      startedAt: runs.startedAt,
    })
    .from(runs)
    .innerJoin(automations, eq(automations.id, runs.automationId))
    .where(
      and(
        eq(automations.engagementId, engagementId),
        gte(runs.startedAt, from),
        sql`${runs.startedAt} < ${to}`,
      ),
    )
    .orderBy(desc(runs.startedAt));

  let successCount = 0;
  let failureCount = 0;
  const automationsSeen = new Set<number>();
  let lastSuccessAt: Date | null = null;
  for (const r of rows) {
    automationsSeen.add(r.automationId);
    if (r.status === 'success') {
      successCount += 1;
      if (!lastSuccessAt || r.startedAt > lastSuccessAt) {
        lastSuccessAt = r.startedAt;
      }
    } else if (r.status === 'failure') {
      failureCount += 1;
    }
  }
  const completed = successCount + failureCount;
  return {
    runsCount: rows.length,
    successCount,
    failureCount,
    successRate: completed > 0 ? successCount / completed : null,
    distinctAutomations: automationsSeen.size,
    lastSuccessAt,
  };
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
