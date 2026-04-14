import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { automations, engagements, runs } from '@/lib/db/schema';

export async function listAutomationsWithCompany() {
  const rows = await db
    .select({
      id: automations.id,
      name: automations.name,
      description: automations.description,
      status: automations.status,
      n8nWorkflowId: automations.n8nWorkflowId,
      createdAt: automations.createdAt,
      companyName: engagements.companyName,
      engagementId: automations.engagementId,
    })
    .from(automations)
    .leftJoin(engagements, eq(automations.engagementId, engagements.id))
    .orderBy(desc(automations.createdAt))
    .limit(200);

  if (rows.length === 0) return [];

  const automationIds = rows.map((r) => r.id);
  const lastRuns = await db
    .selectDistinctOn([runs.automationId], {
      automationId: runs.automationId,
      status: runs.status,
      startedAt: runs.startedAt,
    })
    .from(runs)
    .where(inArray(runs.automationId, automationIds))
    .orderBy(runs.automationId, desc(runs.startedAt));

  const byId = new Map(lastRuns.map((r) => [r.automationId, r]));
  return rows.map((row) => {
    const last = byId.get(row.id);
    return {
      ...row,
      lastRunStatus: last?.status ?? null,
      lastRunStartedAt: last?.startedAt ?? null,
    };
  });
}
