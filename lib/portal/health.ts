import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { automations, runs } from '@/lib/db/schema';
import type { Automation, Run } from '@/lib/db/schema';

export type HealthState = 'healthy' | 'flaky' | 'failing' | 'idle';

export type AutomationHealthInput = {
  automationStatus: Automation['status'];
  runs: Pick<Run, 'status' | 'startedAt'>[]; // last 7 days, most recent first
};

/**
 * Soft contract: we only render the pill for `live` automations. `draft` and
 * `paused` are intentionally idle so the existing StatusPill remains the
 * primary signal for them.
 */
export function computeAutomationHealth(input: AutomationHealthInput): HealthState {
  if (input.automationStatus !== 'live' && input.automationStatus !== 'error') {
    return 'idle';
  }
  if (input.runs.length === 0) return 'failing';
  const [latest] = input.runs;
  if (latest.status === 'failure') return 'failing';
  const hasFailure = input.runs.some((r) => r.status === 'failure');
  return hasFailure ? 'flaky' : 'healthy';
}

export type AutomationHealthRow = {
  automationId: number;
  state: HealthState;
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function listAutomationHealth(
  engagementId: number,
): Promise<AutomationHealthRow[]> {
  const rows = await db
    .select({
      automationId: automations.id,
      automationStatus: automations.status,
      runStatus: runs.status,
      startedAt: runs.startedAt,
    })
    .from(automations)
    .leftJoin(
      runs,
      and(
        eq(runs.automationId, automations.id),
        gte(runs.startedAt, new Date(Date.now() - SEVEN_DAYS_MS)),
      ),
    )
    .where(eq(automations.engagementId, engagementId))
    .orderBy(desc(runs.startedAt));

  const grouped = new Map<
    number,
    { automationStatus: Automation['status']; runs: Pick<Run, 'status' | 'startedAt'>[] }
  >();
  for (const r of rows) {
    const entry = grouped.get(r.automationId) ?? {
      automationStatus: r.automationStatus,
      runs: [],
    };
    if (r.runStatus && r.startedAt) {
      entry.runs.push({ status: r.runStatus, startedAt: r.startedAt });
    }
    grouped.set(r.automationId, entry);
  }

  return [...grouped.entries()].map(([automationId, entry]) => ({
    automationId,
    state: computeAutomationHealth(entry),
  }));
}
