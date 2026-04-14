import Link from 'next/link';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { Pager } from '@/app/admin/_components/Pager';
import { formatRelative } from '@/app/admin/_components/formatters';
import { listIntakeFiltered } from '@/lib/admin/intake';

export const dynamic = 'force-dynamic';

type Row = Awaited<ReturnType<typeof listIntakeFiltered>>['rows'][number];

function buildQuery(params: { q?: string; page?: number }): string {
  const p = new URLSearchParams();
  if (params.q) p.set('q', params.q);
  if (params.page && params.page > 1) p.set('page', String(params.page));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageRaw } = await searchParams;
  const pageNum = Math.max(1, Number(pageRaw) || 1);
  const trimmedQ = q?.trim() ?? '';

  const { rows, total, page, pageSize, totalPages } = await listIntakeFiltered({
    q: trimmedQ,
    page: pageNum,
  });

  const columns: Column<Row>[] = [
    {
      header: 'Submission',
      cell: (r) => (
        <Link href={`/admin/intake/${r.id}`} className="underline">
          #{r.id}
        </Link>
      ),
    },
    { header: 'Company', cell: (r) => r.companyName ?? '—' },
    {
      header: 'Engagement',
      cell: (r) =>
        r.engagementStatus ? <StatusPill status={r.engagementStatus} /> : '—',
    },
    { header: 'Submitted', cell: (r) => formatRelative(r.submittedAt) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Intake submissions</h1>

      <form
        action="/admin/intake"
        method="get"
        className="flex flex-wrap items-end gap-3 border rounded-lg p-3"
      >
        <label className="flex flex-col text-xs">
          <span className="text-neutral-500">Search</span>
          <input
            type="text"
            name="q"
            defaultValue={trimmedQ}
            placeholder="company name"
            className="mt-1 w-64 rounded border px-2 py-1 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-black text-white px-3 py-1 text-xs"
        >
          Apply
        </button>
        {trimmedQ && (
          <Link
            href="/admin/intake"
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
            title={total === 0 && !trimmedQ ? 'No submissions yet' : 'No submissions match'}
            description={
              total === 0 && !trimmedQ
                ? 'Submissions appear here after clients complete the /onboard/[id] flow.'
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
        hrefFor={(p) => `/admin/intake${buildQuery({ q: trimmedQ, page: p })}`}
      />
    </div>
  );
}
