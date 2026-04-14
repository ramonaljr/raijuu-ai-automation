import Link from 'next/link';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { formatRelative } from '@/lib/format/time';
import type { listRecentRunsForEngagement } from '@/lib/portal/data';

type Row = Awaited<ReturnType<typeof listRecentRunsForEngagement>>[number];

function summarizeOutcome(outcomeJson: unknown): string {
  if (!outcomeJson || typeof outcomeJson !== 'object') return '—';
  const o = outcomeJson as { summary?: unknown };
  if (typeof o.summary === 'string' && o.summary.length > 0) {
    return o.summary.length > 80 ? `${o.summary.slice(0, 80)}…` : o.summary;
  }
  return '—';
}

export function RunsTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--portal-border)] bg-white p-8 text-center">
        <p className="text-sm font-medium">No runs yet</p>
        <p className="mt-1 text-sm text-neutral-500">
          Run history appears as your automations execute.
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--portal-border)] bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-[color:var(--portal-border)] bg-[color:var(--portal-surface)] text-left">
          <tr>
            <Th>Automation</Th>
            <Th>Status</Th>
            <Th>Outcome</Th>
            <Th>Started</Th>
            <Th className="w-10" aria-label="Open" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-t border-[color:var(--portal-border)] transition-colors hover:bg-[color:var(--portal-surface)]"
            >
              <Cell>
                <Link
                  href={`/app/runs/${r.id}`}
                  className="block font-medium after:absolute after:inset-0"
                >
                  {r.automationName}
                </Link>
              </Cell>
              <Cell>
                <StatusPill status={r.status} />
              </Cell>
              <Cell className="max-w-md text-neutral-600">
                {summarizeOutcome(r.outcomeJson)}
              </Cell>
              <Cell className="font-mono text-xs text-neutral-500">
                {formatRelative(r.startedAt)}
              </Cell>
              <Cell className="text-neutral-400">→</Cell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  className,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...rest}
      className={`px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-neutral-500 ${className ?? ''}`}
    >
      {children}
    </th>
  );
}

function Cell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`relative px-4 py-3 align-middle ${className ?? ''}`}>
      {children}
    </td>
  );
}
