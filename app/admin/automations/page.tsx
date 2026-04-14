import Link from 'next/link';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { Pager } from '@/app/admin/_components/Pager';
import {
  formatDate,
  formatRelative,
} from '@/app/admin/_components/formatters';
import {
  listAutomationsWithCompany,
  type AutomationStatusFilter,
} from '@/lib/admin/automations';
import { buildN8nWorkflowUrl } from '@/lib/n8n/workflow-url';

export const dynamic = 'force-dynamic';

type Row = Awaited<
  ReturnType<typeof listAutomationsWithCompany>
>['rows'][number];

const STATUS_VALUES = ['all', 'draft', 'live', 'paused', 'error'] as const;

function coerceStatus(v: string | undefined): AutomationStatusFilter {
  return (STATUS_VALUES as readonly string[]).includes(v ?? '')
    ? (v as AutomationStatusFilter)
    : 'all';
}

function buildQuery(params: {
  q?: string;
  status?: AutomationStatusFilter;
  page?: number;
}): string {
  const p = new URLSearchParams();
  if (params.q) p.set('q', params.q);
  if (params.status && params.status !== 'all') p.set('status', params.status);
  if (params.page && params.page > 1) p.set('page', String(params.page));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export default async function AutomationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status: statusRaw, page: pageRaw } = await searchParams;
  const status = coerceStatus(statusRaw);
  const pageNum = Math.max(1, Number(pageRaw) || 1);
  const trimmedQ = q?.trim() ?? '';

  const { rows, total, page, pageSize, totalPages } =
    await listAutomationsWithCompany({ q: trimmedQ, status, page: pageNum });

  const columns: Column<Row>[] = [
    { header: 'Name', cell: (r) => r.name },
    {
      header: 'Client',
      cell: (r) =>
        r.companyName ? (
          <Link href={`/admin/clients/${r.engagementId}`} className="underline">
            {r.companyName}
          </Link>
        ) : (
          '—'
        ),
    },
    { header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
    {
      header: 'Last run',
      cell: (r) =>
        r.lastRunStatus && r.lastRunStartedAt ? (
          <span className="inline-flex items-center gap-2">
            <StatusPill status={r.lastRunStatus} />
            <span className="text-xs text-neutral-500">
              {formatRelative(r.lastRunStartedAt)}
            </span>
          </span>
        ) : (
          <span className="text-xs text-neutral-400">never</span>
        ),
    },
    {
      header: 'n8n workflow',
      cell: (r) => {
        if (!r.n8nWorkflowId) return '—';
        const url = buildN8nWorkflowUrl(r.n8nWorkflowId);
        return url ? (
          <a
            className="underline"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {r.n8nWorkflowId}
          </a>
        ) : (
          <span className="font-mono text-xs">{r.n8nWorkflowId}</span>
        );
      },
    },
    { header: 'Created', cell: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Automations</h1>

      <form
        action="/admin/automations"
        method="get"
        className="flex flex-wrap items-end gap-3 border rounded-lg p-3"
      >
        <label className="flex flex-col text-xs">
          <span className="text-neutral-500">Search</span>
          <input
            type="text"
            name="q"
            defaultValue={trimmedQ}
            placeholder="automation name or company"
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
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="paused">Paused</option>
            <option value="error">Error</option>
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
            href="/admin/automations"
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
                ? 'No automations yet'
                : 'No automations match'
            }
            description={
              total === 0 && !trimmedQ && status === 'all'
                ? 'Automations appear here after n8n POSTs the first run for an engagement.'
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
          `/admin/automations${buildQuery({ q: trimmedQ, status, page: p })}`
        }
      />
    </div>
  );
}
