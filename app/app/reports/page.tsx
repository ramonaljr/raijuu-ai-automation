import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  getEngagementByClerkUserId,
  getCurrentMonthOutcome,
} from '@/lib/portal/data';
import { formatMoneyCents } from '@/lib/format/time';
import { PageHeader } from '../_components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app/reports');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const { month, outcome } = await getCurrentMonthOutcome(engagement.id);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={month} title="Reports" />
      {outcome ? (
        <div className="space-y-8">
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
          {outcome.narrativeMd && (
            <div className="rounded-xl border border-[color:var(--portal-border)] bg-white p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                Notes from Raijuu
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
                {outcome.narrativeMd}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[color:var(--portal-border)] bg-white p-8">
          <p className="text-sm font-medium">No report yet</p>
          <p className="mt-1 max-w-xl text-sm text-neutral-600">
            Your first monthly report computes on the 1st of next month. Need a
            snapshot sooner? Ping Raijuu and we&apos;ll pull it by hand.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--portal-border)] bg-white p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
