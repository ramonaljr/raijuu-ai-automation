import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  formatMoneyCents,
} from '@/app/admin/_components/formatters';
import {
  getEngagementByClerkUserId,
  getCurrentMonthOutcome,
} from '@/lib/portal/data';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app/reports');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const { month, outcome } = await getCurrentMonthOutcome(engagement.id);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold">Reports</h1>
        <p className="text-sm text-neutral-600">{month}</p>
      </div>

      {outcome ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Runs this month" value={String(outcome.runsCount)} />
          <Stat
            label="Time saved"
            value={`${outcome.timeSavedMinutes} min`}
          />
          <Stat
            label="Dollars influenced"
            value={formatMoneyCents(outcome.dollarsInfluencedCents)}
          />
        </div>
      ) : (
        <p className="text-sm text-neutral-600">
          This month's report computes on the 1st of next month. Check back
          then — or ping Raijuu if you want a snapshot sooner.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-xs text-neutral-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
