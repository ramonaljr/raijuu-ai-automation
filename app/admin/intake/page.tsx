import Link from 'next/link';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { formatRelative } from '@/app/admin/_components/formatters';
import { listIntakeSubmissions } from '@/lib/admin/intake';

export const dynamic = 'force-dynamic';

type Row = Awaited<ReturnType<typeof listIntakeSubmissions>>[number];

export default async function IntakePage() {
  const rows = await listIntakeSubmissions();

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
      <Table
        columns={columns}
        rows={rows}
        emptyFallback={
          <EmptyState
            title="No submissions yet"
            description="Submissions appear here after clients complete the /onboard/[id] flow."
          />
        }
      />
    </div>
  );
}
