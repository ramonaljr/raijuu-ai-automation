import Link from 'next/link';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import {
  formatDate,
  formatMoneyCents,
} from '@/app/admin/_components/formatters';
import { listEngagementsWithLead } from '@/lib/admin/clients';

export const dynamic = 'force-dynamic';

type Row = Awaited<ReturnType<typeof listEngagementsWithLead>>[number];

export default async function ClientsPage() {
  const rows = await listEngagementsWithLead();

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
    { header: 'Fee/mo', cell: (r) => formatMoneyCents(r.monthlyFeeCents) },
    { header: 'Started', cell: (r) => formatDate(r.startedAt) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Clients</h1>
      <Table
        columns={columns}
        rows={rows}
        emptyFallback={
          <EmptyState
            title="No engagements yet"
            description="Convert a lead from /admin/leads to create the first engagement."
          />
        }
      />
    </div>
  );
}
