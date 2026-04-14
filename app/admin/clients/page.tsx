import Link from 'next/link';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { Pager } from '@/app/admin/_components/Pager';
import {
  formatDate,
  formatMoneyCents,
} from '@/app/admin/_components/formatters';
import {
  listEngagementsFiltered,
  type EngagementStatusFilter,
} from '@/lib/admin/clients';
import { engagementHealthMap } from '@/lib/admin/health';
import { HealthPill } from '@/app/admin/_components/HealthPill';

export const dynamic = 'force-dynamic';

type Row = Awaited<
  ReturnType<typeof listEngagementsFiltered>
>['rows'][number];

const STATUS_VALUES = ['all', 'onboarding', 'active', 'paused', 'churned'] as const;

function coerceStatus(v: string | undefined): EngagementStatusFilter {
  return (STATUS_VALUES as readonly string[]).includes(v ?? '')
    ? (v as EngagementStatusFilter)
    : 'all';
}

function buildQuery(params: {
  q?: string;
  status?: EngagementStatusFilter;
  page?: number;
}): string {
  const p = new URLSearchParams();
  if (params.q) p.set('q', params.q);
  if (params.status && params.status !== 'all') p.set('status', params.status);
  if (params.page && params.page > 1) p.set('page', String(params.page));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status: statusRaw, page: pageRaw } = await searchParams;
  const status = coerceStatus(statusRaw);
  const pageNum = Math.max(1, Number(pageRaw) || 1);
  const trimmedQ = q?.trim() ?? '';

  const [result, healthMap] = await Promise.all([
    listEngagementsFiltered({ q: trimmedQ, status, page: pageNum }),
    engagementHealthMap(),
  ]);

  const { rows, total, page, pageSize, totalPages } = result;

  const columns: Column<Row>[] = [
    {
      header: 'Company',
      cell: (r) => (
        <Link href={`/admin/clients/${r.id}`} className="underline">
          {r.companyName}
        </Link>
      ),
    },
    { header: 'Email', cell: (r) => r.leadEmail ?? '—' },
    { header: 'Industry', cell: (r) => r.leadIndustry ?? '—' },
    { header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
    {
      header: 'Health',
      cell: (r) => <HealthPill health={healthMap.get(r.id) ?? 'unknown'} />,
    },
    { header: 'Fee/mo', cell: (r) => formatMoneyCents(r.monthlyFeeCents) },
    { header: 'Started', cell: (r) => formatDate(r.startedAt) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Clients</h1>

      <form
        action="/admin/clients"
        method="get"
        className="flex flex-wrap items-end gap-3 border rounded-lg p-3"
      >
        <label className="flex flex-col text-xs">
          <span className="text-neutral-500">Search</span>
          <input
            type="text"
            name="q"
            defaultValue={trimmedQ}
            placeholder="company, email, or industry"
            className="mt-1 w-64 rounded border px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs">
          <span className="text-neutral-500">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="mt-1 rounded border px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="onboarding">Onboarding</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="churned">Churned</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded bg-black text-white px-3 py-1 text-xs"
        >
          Apply
        </button>
        {(trimmedQ || status !== 'all') && (
          <Link
            href="/admin/clients"
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
              total === 0 && !trimmedQ && status === 'all'
                ? 'No engagements yet'
                : 'No engagements match'
            }
            description={
              total === 0 && !trimmedQ && status === 'all'
                ? 'Convert a lead from /admin/leads to create the first engagement.'
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
          `/admin/clients${buildQuery({ q: trimmedQ, status, page: p })}`
        }
      />
    </div>
  );
}
