import { count, desc, eq, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { intakeSubmissions, engagements } from '@/lib/db/schema';

export async function listIntakeSubmissions() {
  return db
    .select({
      id: intakeSubmissions.id,
      engagementId: intakeSubmissions.engagementId,
      submittedAt: intakeSubmissions.submittedAt,
      companyName: engagements.companyName,
      engagementStatus: engagements.status,
    })
    .from(intakeSubmissions)
    .leftJoin(engagements, eq(intakeSubmissions.engagementId, engagements.id))
    .orderBy(desc(intakeSubmissions.submittedAt))
    .limit(200);
}

export type ListIntakeArgs = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export type ListIntakeResult = {
  rows: Awaited<ReturnType<typeof listIntakeSubmissions>>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildIntakeWhere(q: string | undefined): SQL | undefined {
  if (!q || q.trim().length === 0) return undefined;
  const pattern = `%${q.trim()}%`;
  return sql`${engagements.companyName} ILIKE ${pattern}`;
}

export async function listIntakeFiltered(
  args: ListIntakeArgs = {},
): Promise<ListIntakeResult> {
  const pageSize = args.pageSize ?? 20;
  const page = Math.max(1, args.page ?? 1);
  const where = buildIntakeWhere(args.q);

  const selectCols = {
    id: intakeSubmissions.id,
    engagementId: intakeSubmissions.engagementId,
    submittedAt: intakeSubmissions.submittedAt,
    companyName: engagements.companyName,
    engagementStatus: engagements.status,
  };

  const rowsQuery = db
    .select(selectCols)
    .from(intakeSubmissions)
    .leftJoin(engagements, eq(intakeSubmissions.engagementId, engagements.id))
    .orderBy(desc(intakeSubmissions.submittedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const countQuery = db
    .select({ value: count() })
    .from(intakeSubmissions)
    .leftJoin(engagements, eq(intakeSubmissions.engagementId, engagements.id));

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

export async function getIntakeDetail(id: number) {
  const [row] = await db
    .select({
      submission: intakeSubmissions,
      engagement: engagements,
    })
    .from(intakeSubmissions)
    .leftJoin(engagements, eq(intakeSubmissions.engagementId, engagements.id))
    .where(eq(intakeSubmissions.id, id))
    .limit(1);
  return row ?? null;
}
