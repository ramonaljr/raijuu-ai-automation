import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { automations, engagements, runs } from '@/lib/db/schema';

export type AutomationStatusFilter =
  | 'all'
  | 'draft'
  | 'live'
  | 'paused'
  | 'error';

export type ListAutomationsArgs = {
  q?: string;
  status?: AutomationStatusFilter;
  page?: number;
  pageSize?: number;
};

type Row = {
  id: number;
  name: string;
  description: string | null;
  status: 'draft' | 'live' | 'paused' | 'error';
  n8nWorkflowId: string | null;
  createdAt: Date;
  companyName: string | null;
  engagementId: number;
  lastRunStatus: 'success' | 'failure' | 'running' | null;
  lastRunStartedAt: Date | null;
};

export type ListAutomationsResult = {
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildAutomationsWhere(
  q: string | undefined,
  status: AutomationStatusFilter,
): SQL | undefined {
  const clauses: SQL[] = [];
  if (q && q.trim().length > 0) {
    const pattern = `%${q.trim()}%`;
    clauses.push(
      sql`(${automations.name} ILIKE ${pattern} OR ${engagements.companyName} ILIKE ${pattern})`,
    );
  }
  if (status !== 'all') {
    clauses.push(eq(automations.status, status));
  }
  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return and(...clauses);
}

export async function listAutomationsWithCompany(
  args: ListAutomationsArgs = {},
): Promise<ListAutomationsResult> {
  const pageSize = args.pageSize ?? 20;
  const page = Math.max(1, args.page ?? 1);
  const status = args.status ?? 'all';
  const where = buildAutomationsWhere(args.q, status);

  const rowsQuery = db
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
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const countQuery = db
    .select({ value: count() })
    .from(automations)
    .leftJoin(engagements, eq(automations.engagementId, engagements.id));

  const [baseRows, totalRow] = await Promise.all([
    where ? rowsQuery.where(where) : rowsQuery,
    where ? countQuery.where(where) : countQuery,
  ]);

  const total = totalRow[0]?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (baseRows.length === 0) {
    return { rows: [], total, page, pageSize, totalPages };
  }

  const automationIds = baseRows.map((r) => r.id);
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
  const rows: Row[] = baseRows.map((row) => {
    const last = byId.get(row.id);
    return {
      ...row,
      lastRunStatus: last?.status ?? null,
      lastRunStartedAt: last?.startedAt ?? null,
    };
  });

  return { rows, total, page, pageSize, totalPages };
}
