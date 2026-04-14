import Link from 'next/link';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import {
  formatDate,
  formatRelative,
} from '@/app/admin/_components/formatters';
import { ConvertLeadButton } from './ConvertLeadButton';
import { listLeadsFiltered, type BookedFilter } from '@/lib/admin/leads';
import type { Lead } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const BOOKED_VALUES = ['all', 'yes', 'no'] as const;

function coerceBooked(v: string | undefined): BookedFilter {
  return (BOOKED_VALUES as readonly string[]).includes(v ?? '')
    ? (v as BookedFilter)
    : 'all';
}

function buildQuery(params: {
  q?: string;
  booked?: BookedFilter;
  page?: number;
}): string {
  const p = new URLSearchParams();
  if (params.q) p.set('q', params.q);
  if (params.booked && params.booked !== 'all') p.set('booked', params.booked);
  if (params.page && params.page > 1) p.set('page', String(params.page));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; booked?: string; page?: string }>;
}) {
  const { q, booked: bookedRaw, page: pageRaw } = await searchParams;
  const booked = coerceBooked(bookedRaw);
  const pageNum = Math.max(1, Number(pageRaw) || 1);
  const trimmedQ = q?.trim() ?? '';

  const { rows, total, page, pageSize, totalPages } = await listLeadsFiltered({
    q: trimmedQ,
    booked,
    page: pageNum,
  });

  const columns: Column<Lead>[] = [
    { header: 'Email', cell: (r) => r.email },
    { header: 'Industry', cell: (r) => r.industry },
    {
      header: 'Situation',
      cell: (r) => r.situationText.slice(0, 80),
      className: 'max-w-sm',
    },
    { header: 'Booked', cell: (r) => formatDate(r.bookedAt) },
    { header: 'Created', cell: (r) => formatRelative(r.createdAt) },
    { header: 'Action', cell: (r) => <ConvertLeadButton leadId={r.id} email={r.email} /> },
  ];

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const prevHref = `/admin/leads${buildQuery({ q: trimmedQ, booked, page: page - 1 })}`;
  const nextHref = `/admin/leads${buildQuery({ q: trimmedQ, booked, page: page + 1 })}`;

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
        <button
          type="submit"
          className="rounded bg-black text-white px-3 py-1 text-xs"
        >
          Apply
        </button>
        {(trimmedQ || booked !== 'all') && (
          <Link href="/admin/leads" className="text-xs underline text-neutral-600">
            Reset
          </Link>
        )}
      </form>

      <Table
        columns={columns}
        rows={rows}
        emptyFallback={
          <EmptyState
            title={total === 0 && !trimmedQ && booked === 'all' ? 'No leads yet' : 'No leads match'}
            description={
              total === 0 && !trimmedQ && booked === 'all'
                ? 'Leads appear here as prospects submit the demo.'
                : 'Try loosening the filters.'
            }
          />
        }
      />

      {total > 0 && (
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <span>
            {start}–{end} of {total}
          </span>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link href={prevHref} className="rounded border px-2 py-0.5 hover:bg-neutral-50">
                ← Prev
              </Link>
            ) : (
              <span className="rounded border px-2 py-0.5 opacity-40">← Prev</span>
            )}
            <span>
              Page {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={nextHref} className="rounded border px-2 py-0.5 hover:bg-neutral-50">
                Next →
              </Link>
            ) : (
              <span className="rounded border px-2 py-0.5 opacity-40">Next →</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
