import { and, asc, count, desc, isNotNull, isNull, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads, type Lead } from '@/lib/db/schema';

export type BookedFilter = 'all' | 'yes' | 'no';

export type LeadSortField = 'created' | 'email' | 'industry' | 'booked';
export type SortDir = 'asc' | 'desc';

export const LEAD_SORT_FIELDS: readonly LeadSortField[] = [
  'created',
  'email',
  'industry',
  'booked',
];

export type ListLeadsArgs = {
  q?: string;
  booked?: BookedFilter;
  sort?: LeadSortField;
  dir?: SortDir;
  page?: number;
  pageSize?: number;
};

export type ListLeadsResult = {
  rows: Lead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildWhere(q: string | undefined, booked: BookedFilter): SQL | undefined {
  const clauses: SQL[] = [];
  if (q && q.trim().length > 0) {
    const pattern = `%${q.trim()}%`;
    clauses.push(
      sql`(${leads.email} ILIKE ${pattern} OR ${leads.situationText} ILIKE ${pattern} OR ${leads.industry} ILIKE ${pattern})`,
    );
  }
  if (booked === 'yes') clauses.push(isNotNull(leads.bookedAt));
  if (booked === 'no') clauses.push(isNull(leads.bookedAt));
  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return and(...clauses);
}

function buildOrderBy(sort: LeadSortField, dir: SortDir): SQL {
  const column =
    sort === 'email'
      ? leads.email
      : sort === 'industry'
        ? leads.industry
        : sort === 'booked'
          ? leads.bookedAt
          : leads.createdAt;
  return dir === 'asc' ? asc(column) : desc(column);
}

export async function listLeadsFiltered(
  args: ListLeadsArgs = {},
): Promise<ListLeadsResult> {
  const pageSize = args.pageSize ?? 20;
  const page = Math.max(1, args.page ?? 1);
  const booked = args.booked ?? 'all';
  const sort = args.sort ?? 'created';
  const dir = args.dir ?? 'desc';
  const where = buildWhere(args.q, booked);

  const rowsQuery = db
    .select()
    .from(leads)
    .orderBy(buildOrderBy(sort, dir))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const countQuery = db.select({ value: count() }).from(leads);

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
