import Link from 'next/link';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { formatRelative } from '@/lib/format/time';
import type { listRecentRunsForEngagement } from '@/lib/portal/data';

type Row = Awaited<ReturnType<typeof listRecentRunsForEngagement>>[number];

export function RecentActivity({ runs }: { runs: Row[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
          Recent activity
        </p>
        <Link
          href="/app/runs"
          className="text-xs text-neutral-500 hover:text-foreground"
        >
          View all →
        </Link>
      </div>
      <ul className="divide-y divide-[color:var(--portal-border)] overflow-hidden rounded-xl border border-[color:var(--portal-border)] bg-white">
        {runs.map((r) => (
          <li key={r.id} className="relative">
            <Link
              href={`/app/runs/${r.id}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-[color:var(--portal-surface)]"
            >
              <StatusPill status={r.status} />
              <span className="flex-1 truncate text-sm">{r.automationName}</span>
              <span className="font-mono text-xs text-neutral-500">
                {formatRelative(r.startedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
