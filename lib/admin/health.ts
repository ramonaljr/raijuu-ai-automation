import { eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { automations, runs } from '@/lib/db/schema';

export type EngagementHealth =
  | 'healthy'
  | 'degraded'
  | 'unhealthy'
  | 'unknown';

/**
 * Health thresholds are derived from failure rate across recent runs:
 *   ≥95% success → healthy, 80–95% → degraded, <80% → unhealthy.
 * Zero-run engagements are 'unknown' — we don't penalize a new client
 * whose first automations haven't fired yet.
 */
export function computeHealth(
  total: number,
  failures: number,
): EngagementHealth {
  if (total === 0) return 'unknown';
  const successRate = (total - failures) / total;
  if (successRate >= 0.95) return 'healthy';
  if (successRate >= 0.8) return 'degraded';
  return 'unhealthy';
}

/**
 * Returns a Map<engagementId, health> keyed by every engagement that had at
 * least one run in the window. Engagements with no runs are omitted — the
 * caller decides how to render 'unknown' for them.
 */
export type GlobalRunStats = {
  total: number;
  failures: number;
};

export async function getGlobalRunStats(
  windowDays = 7,
): Promise<GlobalRunStats> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      failures: sql<number>`count(*) filter (where ${runs.status} = 'failure')::int`,
    })
    .from(runs)
    .where(gte(runs.startedAt, since));
  return { total: row?.total ?? 0, failures: row?.failures ?? 0 };
}

export async function engagementHealthMap(
  windowDays = 7,
): Promise<Map<number, EngagementHealth>> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      engagementId: automations.engagementId,
      total: sql<number>`count(*)::int`,
      failures: sql<number>`count(*) filter (where ${runs.status} = 'failure')::int`,
    })
    .from(runs)
    .innerJoin(automations, eq(automations.id, runs.automationId))
    .where(gte(runs.startedAt, since))
    .groupBy(automations.engagementId);

  const map = new Map<number, EngagementHealth>();
  for (const r of rows) {
    map.set(r.engagementId, computeHealth(r.total, r.failures));
  }
  return map;
}

