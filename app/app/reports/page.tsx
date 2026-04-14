import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  getEngagementByClerkUserId,
  getLiveMonthSnapshot,
  getOutcomeForMonth,
  listMonthsWithOutcomes,
  currentUtcMonth,
} from '@/lib/portal/data';
import { formatMoneyCents, formatRelative } from '@/lib/format/time';
import { PageHeader } from '../_components/PageHeader';

export const dynamic = 'force-dynamic';

const MONTH_RE = /^\d{4}-\d{2}$/;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app/reports');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const { month: raw } = await searchParams;
  const requested = raw && MONTH_RE.test(raw) ? raw : null;
  const current = currentUtcMonth();
  const selectedMonth = requested ?? current;

  const isCurrentMonth = selectedMonth === current;
  const [{ outcome }, historyMonths, liveSnapshot] = await Promise.all([
    getOutcomeForMonth(engagement.id, selectedMonth),
    listMonthsWithOutcomes(engagement.id),
    isCurrentMonth
      ? getLiveMonthSnapshot(engagement.id, selectedMonth)
      : Promise.resolve(null),
  ]);

  // Always surface the current month in the selector, even if there's no row yet.
  const monthsForNav = historyMonths.includes(current)
    ? historyMonths
    : [current, ...historyMonths];
  const month = selectedMonth;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={month} title="Reports" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {monthsForNav.length > 1 ? (
          <MonthSelector months={monthsForNav} selected={month} />
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <a
            href={`/api/reports/export?month=${month}`}
            className="rounded-full border border-[color:var(--portal-border)] bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:border-[color:var(--accent)]"
          >
            Download CSV
          </a>
          <a
            href={`/api/reports/export-pdf?month=${month}`}
            className="rounded-full border border-[color:var(--portal-border)] bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:border-[color:var(--accent)]"
          >
            Download PDF
          </a>
        </div>
      </div>
      {liveSnapshot && (
        <LiveSnapshotCard snapshot={liveSnapshot} hasFinalized={Boolean(outcome)} />
      )}
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
        !liveSnapshot && (
          <div className="rounded-xl border border-dashed border-[color:var(--portal-border)] bg-white p-8">
            <p className="text-sm font-medium">No report yet</p>
            <p className="mt-1 max-w-xl text-sm text-neutral-600">
              Your first monthly report computes on the 1st of next month. Need a
              snapshot sooner? Ping Raijuu and we&apos;ll pull it by hand.
            </p>
          </div>
        )
      )}
    </div>
  );
}

function LiveSnapshotCard({
  snapshot,
  hasFinalized,
}: {
  snapshot: import('@/lib/portal/data').LiveMonthSnapshot;
  hasFinalized: boolean;
}) {
  const successPct =
    snapshot.successRate == null
      ? '—'
      : `${Math.round(snapshot.successRate * 100)}%`;
  return (
    <div className="rounded-xl border border-[color:var(--portal-border)] bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
          This month so far {hasFinalized ? '' : '(live)'}
        </p>
        <p className="text-xs text-neutral-500">
          {hasFinalized
            ? 'Live counter — finalized totals below.'
            : 'Finalized monthly report publishes on the 1st of next month.'}
        </p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <Stat label="Runs MTD" value={String(snapshot.runsCount)} />
        <Stat
          label="Active automations"
          value={String(snapshot.distinctAutomations)}
        />
        <Stat label="Success rate" value={successPct} />
        <Stat
          label="Last success"
          value={formatRelative(snapshot.lastSuccessAt)}
        />
      </div>
      {snapshot.runsCount === 0 && (
        <p className="mt-4 text-xs text-neutral-500">
          No runs recorded this month yet. Automations show up here as soon as
          n8n posts a result.
        </p>
      )}
    </div>
  );
}

function MonthSelector({
  months,
  selected,
}: {
  months: string[];
  selected: string;
}) {
  return (
    <nav
      aria-label="Reports month selector"
      className="flex flex-wrap gap-2"
    >
      {months.map((m) => {
        const isActive = m === selected;
        return (
          <Link
            key={m}
            href={`/app/reports?month=${m}`}
            aria-current={isActive ? 'page' : undefined}
            className={
              isActive
                ? 'rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background'
                : 'rounded-full border border-[color:var(--portal-border)] bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:border-[color:var(--accent)]'
            }
          >
            {m}
          </Link>
        );
      })}
    </nav>
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
