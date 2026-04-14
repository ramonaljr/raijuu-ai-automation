import Link from 'next/link';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { Pager } from '@/app/admin/_components/Pager';
import { SortHeader } from '@/app/admin/_components/SortHeader';
import {
  formatDate,
  formatRelative,
} from '@/app/admin/_components/formatters';
import { ConvertLeadButton } from './ConvertLeadButton';
import {
  listLeadsFiltered,
  LEAD_SORT_FIELDS,
  type BookedFilter,
  type LeadSortField,
  type SortDir,
} from '@/lib/admin/leads';
import type { Lead } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const BOOKED_VALUES = ['all', 'yes', 'no'] as const;
const DIR_VALUES: readonly SortDir[] = ['asc', 'desc'];

function coerceBooked(v: string | undefined): BookedFilter {
  return (BOOKED_VALUES as readonly string[]).includes(v ?? '')
    ? (v as BookedFilter)
    : 'all';
}

function coerceSort(v: string | undefined): LeadSortField {
  return (LEAD_SORT_FIELDS as readonly string[]).includes(v ?? '')
    ? (v as LeadSortField)
    : 'created';
}

function coerceDir(v: string | undefined): SortDir {
  return (DIR_VALUES as readonly string[]).includes(v ?? '')
    ? (v as SortDir)
    : 'desc';
}

function buildQuery(params: {
  q?: string;
  booked?: BookedFilter;
  sort?: LeadSortField;
  dir?: SortDir;
  page?: number;
}): string {
  const p = new URLSearchParams();
  if (params.q) p.set('q', params.q);
  if (params.booked && params.booked !== 'all') p.set('booked', params.booked);
  if (params.sort && params.sort !== 'created') p.set('sort', params.sort);
  if (params.dir && params.dir !== 'desc') p.set('dir', params.dir);
  if (params.page && params.page > 1) p.set('page', String(params.page));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    booked?: string;
    sort?: string;
    dir?: string;
    page?: string;
  }>;
}) {
  const {
    q,
    booked: bookedRaw,
    sort: sortRaw,
    dir: dirRaw,
    page: pageRaw,
  } = await searchParams;
  const booked = coerceBooked(bookedRaw);
  const sort = coerceSort(sortRaw);
  const dir = coerceDir(dirRaw);
  const pageNum = Math.max(1, Number(pageRaw) || 1);
  const trimmedQ = q?.trim() ?? '';

  const { rows, total, page, pageSize, totalPages } = await listLeadsFiltered({
    q: trimmedQ,
    booked,
    sort,
    dir,
    page: pageNum,
  });

  const hrefForSort = (field: string, nextDir: 'asc' | 'desc') =>
    `/admin/leads${buildQuery({
      q: trimmedQ,
      booked,
      sort: field as LeadSortField,
      dir: nextDir,
      page: 1,
    })}`;

  const sortHeader = (label: string, field: LeadSortField) => (
    <SortHeader
      label={label}
      field={field}
      activeField={sort}
      activeDir={dir}
      hrefFor={hrefForSort}
    />
  );

  const columns: Column<Lead>[] = [
    { header: sortHeader('Email', 'email'), cell: (r) => r.email },
    { header: sortHeader('Industry', 'industry'), cell: (r) => r.industry },
    {
      header: 'Situation',
      cell: (r) => r.situationText.slice(0, 80),
      className: 'max-w-sm',
    },
    {
      header: sortHeader('Booked', 'booked'),
      cell: (r) => formatDate(r.bookedAt),
    },
    {
      header: sortHeader('Created', 'created'),
      cell: (r) => formatRelative(r.createdAt),
    },
    {
      header: 'Action',
      cell: (r) => <ConvertLeadButton leadId={r.id} email={r.email} />,
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Leads</h1>

      <form
        action="/admin/leads"
        method="get"
        className="flex flex-wrap items-end gap-3 border rounded-lg p-3"
      >
        <label className="flex flex-col text-xs">
          <span className="text-neutral-500">Search</span>
          <input
            type="text"
            name="q"
            defaultValue={trimmedQ}
            placeholder="email, industry, or situation"
            className="mt-1 w-64 rounded border px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs">
          <span className="text-neutral-500">Booked</span>
          <select
            name="booked"
            defaultValue={booked}
            className="mt-1 rounded border px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="yes">Booked</option>
            <option value="no">Not booked</option>
          </select>
        </label>
        {/* Preserve sort across search submission so the user doesn't lose it. */}
        {sort !== 'created' && <input type="hidden" name="sort" value={sort} />}
        {dir !== 'desc' && <input type="hidden" name="dir" value={dir} />}
        <button
          type="submit"
          className="rounded bg-black text-white px-3 py-1 text-xs"
        >
          Apply
        </button>
        {(trimmedQ || booked !== 'all' || sort !== 'created' || dir !== 'desc') && (
          <Link
            href="/admin/leads"
            className="text-xs underline text-neutral-600"
          >
            Reset
          </Link>
        )}
      </form>

      <Table
        columns={columns}
        rows={rows}
        emptyFallback={
          <EmptyState
            title={
              total === 0 && !trimmedQ && booked === 'all'
                ? 'No leads yet'
                : 'No leads match'
            }
            description={
              total === 0 && !trimmedQ && booked === 'all'
                ? 'Leads appear here as prospects submit the demo.'
                : 'Try loosening the filters.'
            }
          />
        }
      />

      <Pager
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        hrefFor={(p) =>
          `/admin/leads${buildQuery({
            q: trimmedQ,
            booked,
            sort,
            dir,
            page: p,
          })}`
        }
      />
    </div>
  );
}
