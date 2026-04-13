import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { formatRelative } from '@/app/admin/_components/formatters';
import {
  getEngagementByClerkUserId,
  listRecentRunsForEngagement,
} from '@/lib/portal/data';

export const dynamic = 'force-dynamic';

type Row = Awaited<ReturnType<typeof listRecentRunsForEngagement>>[number];

function summarizeOutcome(outcomeJson: unknown): string {
  if (!outcomeJson || typeof outcomeJson !== 'object') return '—';
  const o = outcomeJson as { summary?: unknown };
  if (typeof o.summary === 'string' && o.summary.length > 0) {
    return o.summary.length > 80 ? `${o.summary.slice(0, 80)}…` : o.summary;
  }
  return '—';
}

export default async function RunsPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app/runs');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const rows = await listRecentRunsForEngagement(engagement.id);

  const columns: Column<Row>[] = [
    { header: 'Automation', cell: (r) => r.automationName },
    { header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
    { header: 'Outcome', cell: (r) => summarizeOutcome(r.outcomeJson) },
    { header: 'Started', cell: (r) => formatRelative(r.startedAt) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Recent runs</h1>
      <Table
        columns={columns}
        rows={rows}
        emptyFallback={
          <EmptyState
            title="No runs yet"
            description="Run history appears as your automations execute."
          />
        }
      />
    </div>
  );
}
