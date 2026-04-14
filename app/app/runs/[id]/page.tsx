import { currentUser } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getEngagementByClerkUserId,
  getRunForEngagement,
} from '@/lib/portal/data';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { formatRelative } from '@/lib/format/time';
import { PageHeader } from '../../_components/PageHeader';

export const dynamic = 'force-dynamic';

function formatDuration(
  startedAt: Date,
  finishedAt: Date | null,
): string {
  if (!finishedAt) return 'running…';
  const ms = finishedAt.getTime() - startedAt.getTime();
  const sec = Math.max(0, Math.round(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return remSec === 0 ? `${min}m` : `${min}m ${remSec}s`;
}

function formatTimestamp(d: Date | null): string {
  if (!d) return '—';
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app/runs');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const { id } = await params;
  const runId = Number(id);
  if (!Number.isFinite(runId) || runId <= 0) notFound();

  const run = await getRunForEngagement(engagement.id, runId);
  if (!run) notFound();

  const outcomePretty = run.outcomeJson
    ? JSON.stringify(run.outcomeJson, null, 2)
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <Link href="/app/runs" className="hover:underline">
            ← Runs
          </Link>
        }
        title={run.automationName}
        subtitle={`Run #${run.id}`}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Status" value={<StatusPill status={run.status} />} />
        <Stat label="Started" value={formatRelative(run.startedAt)} />
        <Stat
          label="Duration"
          value={formatDuration(run.startedAt, run.finishedAt)}
        />
        <Stat
          label="n8n execution"
          value={
            run.n8nExecutionId ? (
              <span className="font-mono text-xs">{run.n8nExecutionId}</span>
            ) : (
              '—'
            )
          }
        />
      </section>

      <section className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
          Timing
        </p>
        <div className="rounded-xl border border-[color:var(--portal-border)] bg-white p-5 text-sm">
          <Row label="Started" value={formatTimestamp(run.startedAt)} />
          <Row label="Finished" value={formatTimestamp(run.finishedAt)} />
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
          Outcome
        </p>
        {outcomePretty ? (
          <pre className="overflow-auto rounded-xl border border-[color:var(--portal-border)] bg-white p-5 font-mono text-xs leading-relaxed text-neutral-800">
            {outcomePretty}
          </pre>
        ) : (
          <div className="rounded-xl border border-dashed border-[color:var(--portal-border)] bg-white p-5 text-sm text-neutral-500">
            No outcome payload was recorded for this run.
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[color:var(--portal-border)] bg-white p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[color:var(--portal-border)] py-2 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-neutral-500">{label}</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
}
