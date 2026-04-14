import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  getEngagementByClerkUserId,
  listRecentRunsForEngagement,
} from '@/lib/portal/data';
import { PageHeader } from '../_components/PageHeader';
import { RunsTable } from './_components/RunsTable';

export const dynamic = 'force-dynamic';

export default async function RunsPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app/runs');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const rows = await listRecentRunsForEngagement(engagement.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Runs"
        subtitle="The 30 most recent executions across your automations."
      />
      <RunsTable rows={rows} />
    </div>
  );
}
