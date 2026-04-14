import { and, count, desc, eq, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  engagements,
  leads,
  intakeSubmissions,
} from '@/lib/db/schema';

export async function listEngagementsWithLead() {
  return db
    .select({
      id: engagements.id,
      companyName: engagements.companyName,
      status: engagements.status,
      startedAt: engagements.startedAt,
      monthlyFeeCents: engagements.monthlyFeeCents,
      leadEmail: leads.email,
      leadIndustry: leads.industry,
    })
    .from(engagements)
    .leftJoin(leads, eq(engagements.leadId, leads.id))
    .orderBy(desc(engagements.startedAt))
    .limit(200);
}

export type EngagementStatusFilter =
  | 'all'
  | 'onboarding'
  | 'active'
  | 'paused'
  | 'churned';

export type ListEngagementsArgs = {
  q?: string;
  status?: EngagementStatusFilter;
  page?: number;
  pageSize?: number;
};

export type ListEngagementsResult = {
  rows: Awaited<ReturnType<typeof listEngagementsWithLead>>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildEngagementsWhere(
  q: string | undefined,
  status: EngagementStatusFilter,
): SQL | undefined {
  const clauses: SQL[] = [];
  if (q && q.trim().length > 0) {
    const pattern = `%${q.trim()}%`;
    clauses.push(
      sql`(${engagements.companyName} ILIKE ${pattern} OR ${leads.email} ILIKE ${pattern} OR ${leads.industry} ILIKE ${pattern})`,
    );
  }
  if (status !== 'all') {
    clauses.push(eq(engagements.status, status));
  }
  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return and(...clauses);
}

export async function listEngagementsFiltered(
  args: ListEngagementsArgs = {},
): Promise<ListEngagementsResult> {
  const pageSize = args.pageSize ?? 20;
  const page = Math.max(1, args.page ?? 1);
  const status = args.status ?? 'all';
  const where = buildEngagementsWhere(args.q, status);

  const selectCols = {
    id: engagements.id,
    companyName: engagements.companyName,
    status: engagements.status,
    startedAt: engagements.startedAt,
    monthlyFeeCents: engagements.monthlyFeeCents,
    leadEmail: leads.email,
    leadIndustry: leads.industry,
  };

  const rowsQuery = db
    .select(selectCols)
    .from(engagements)
    .leftJoin(leads, eq(engagements.leadId, leads.id))
    .orderBy(desc(engagements.startedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const countQuery = db
    .select({ value: count() })
    .from(engagements)
    .leftJoin(leads, eq(engagements.leadId, leads.id));

  const [rows, totalRow] = await Promise.all([
    where ? rowsQuery.where(where) : rowsQuery,
    where ? countQuery.where(where) : countQuery,
  ]);

  const total = totalRow[0]?.value ?? 0;
  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getEngagementDetail(id: number) {
  const [engagement] = await db
    .select()
    .from(engagements)
    .where(eq(engagements.id, id))
    .limit(1);
  if (!engagement) return null;

  const lead = engagement.leadId
    ? (await db.select().from(leads).where(eq(leads.id, engagement.leadId)).limit(1))[0] ?? null
    : null;

  const [intake] = await db
    .select()
    .from(intakeSubmissions)
    .where(eq(intakeSubmissions.engagementId, id))
    .orderBy(desc(intakeSubmissions.submittedAt))
    .limit(1);

  return { engagement, lead, intake: intake ?? null };
}
