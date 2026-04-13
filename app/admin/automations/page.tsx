import Link from 'next/link';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { formatDate } from '@/app/admin/_components/formatters';
import { listAutomationsWithCompany } from '@/lib/admin/automations';

export const dynamic = 'force-dynamic';

type Row = Awaited<ReturnType<typeof listAutomationsWithCompany>>[number];

export default async function AutomationsPage() {
  const rows = await listAutomationsWithCompany();

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
    { header: 'n8n workflow', cell: (r) => r.n8nWorkflowId ?? '—' },
    { header: 'Created', cell: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Automations</h1>
      <Table
        columns={columns}
        rows={rows}
        emptyFallback={
          <EmptyState
            title="No automations yet"
            description="Phase 4 wires the n8n webhook that populates this table."
          />
        }
      />
    </div>
  );
}
