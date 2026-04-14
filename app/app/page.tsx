import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  getEngagementByClerkUserId,
  getLastRunForEngagement,
  listAutomationsForEngagement,
  listRecentRunsForEngagement,
} from '@/lib/portal/data';
import { listAutomationHealth } from '@/lib/portal/health';
import { PageHeader } from './_components/PageHeader';
import { FocusCard } from './_components/FocusCard';
import { selectFocusVariant, type FocusRun } from './_components/focus';
import { RecentActivity } from './_components/RecentActivity';
import { AutomationsSection } from './_components/AutomationsSection';

export const dynamic = 'force-dynamic';

export default async function PortalHome() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const [lastRun, automations, recentRuns, health] = await Promise.all([
    getLastRunForEngagement(engagement.id),
    listAutomationsForEngagement(engagement.id),
    listRecentRunsForEngagement(engagement.id),
    listAutomationHealth(engagement.id),
  ]);
  const healthByAutomationId = Object.fromEntries(
    health.map((h) => [h.automationId, h.state]),
  );

  const focusVariant = selectFocusVariant({
    lastRun: lastRun
      ? ({
          id: lastRun.id,
          automationName: lastRun.automationName,
          status: lastRun.status,
          startedAt: lastRun.startedAt,
        } satisfies FocusRun)
      : null,
  });

  const firstName = user.firstName ?? 'there';

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={engagement.companyName}
        title={`Hi ${firstName} — here's today.`}
        reveal
      />
      <FocusCard variant={focusVariant} />
      {recentRuns.length > 0 && <RecentActivity runs={recentRuns.slice(0, 3)} />}
      <AutomationsSection
        rows={automations}
        healthByAutomationId={healthByAutomationId}
      />
    </div>
  );
}
