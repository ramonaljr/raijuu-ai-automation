import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import {
  formatDate,
  formatRelative,
} from '@/app/admin/_components/formatters';
import { ConvertLeadButton } from './ConvertLeadButton';
import { listLeads } from '@/lib/admin/leads';
import type { Lead } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const rows = await listLeads();

  const columns: Column<Lead>[] = [
    { header: 'Email', cell: (r) => r.email },
    { header: 'Industry', cell: (r) => r.industry },
    { header: 'Situation', cell: (r) => r.situationText.slice(0, 80), className: 'max-w-sm' },
    { header: 'Booked', cell: (r) => formatDate(r.bookedAt) },
    { header: 'Created', cell: (r) => formatRelative(r.createdAt) },
    { header: 'Action', cell: (r) => <ConvertLeadButton leadId={r.id} email={r.email} /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Leads</h1>
      <Table
        columns={columns}
        rows={rows}
        emptyFallback={<EmptyState title="No leads yet" description="Leads appear here as prospects submit the demo." />}
      />
    </div>
  );
}
