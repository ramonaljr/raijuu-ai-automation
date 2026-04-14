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

export async function getCurrentMonthOutcome(engagementId: number) {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
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
