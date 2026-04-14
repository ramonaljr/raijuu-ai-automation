import Link from 'next/link';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { formatRelative } from '@/app/admin/_components/formatters';
import { listDeadLetters } from '@/lib/admin/dead-letter';
import { RowActions } from './RowActions';

export const dynamic = 'force-dynamic';

type Row = Awaited<ReturnType<typeof listDeadLetters>>[number];

export default async function DeadLetterPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show } = await searchParams;
  const includeResolved = show === 'all';
  const rows = await listDeadLetters({ resolved: includeResolved });

  const columns: Column<Row>[] = [
    { header: 'Source', cell: (r) => <span className="font-mono text-xs">{r.source}</span> },
    { header: 'Error', cell: (r) => <span className="text-xs">{r.errorMessage}</span>, className: 'max-w-md' },
    { header: 'Received', cell: (r) => formatRelative(r.receivedAt) },
    { header: 'Retries', cell: (r) => r.retryCount },
    {
      header: 'Status',
      cell: (r) =>
        r.resolvedAt ? (
          <span className="text-xs text-green-700">resolved</span>
        ) : (
          <span className="text-xs text-red-700">open</span>
        ),
    },
    {
      header: 'Actions',
      cell: (r) => (r.resolvedAt ? '—' : <RowActions id={r.id} />),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Dead-letter</h1>
        <Link
          href={includeResolved ? '/admin/dead-letter' : '/admin/dead-letter?show=all'}
          className="text-xs underline"
        >
          {includeResolved ? 'Hide resolved' : 'Show resolved'}
        </Link>
      </div>
      <Table
        columns={columns}
        rows={rows}
        emptyFallback={
          <EmptyState
            title={includeResolved ? 'No dead-letter entries' : 'No open dead-letter entries'}
            description="Failed webhook payloads land here. Retry re-posts to the endpoint; resolve dismisses without re-processing."
          />
        }
      />
    </div>
  );
}
