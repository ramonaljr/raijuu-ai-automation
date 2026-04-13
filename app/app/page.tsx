import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { formatDate } from '@/app/admin/_components/formatters';
import {
  getEngagementByClerkUserId,
  listAutomationsForEngagement,
} from '@/lib/portal/data';
import type { Automation } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function PortalHome() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const rows = await listAutomationsForEngagement(engagement.id);

  const columns: Column<Automation>[] = [
    { header: 'Name', cell: (r) => r.name },
    {
      header: 'What it does',
      cell: (r) => r.description ?? '—',
      className: 'max-w-md',
    },
    { header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
    { header: 'Live since', cell: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{engagement.companyName}</h1>
      <p className="text-sm text-neutral-600">Your automations</p>
      <Table
        columns={columns}
        rows={rows}
        emptyFallback={
          <EmptyState
            title="No automations yet"
            description="Raijuu is building your first automations. You'll see them here as soon as they're live."
          />
        }
      />
    </div>
  );
}
