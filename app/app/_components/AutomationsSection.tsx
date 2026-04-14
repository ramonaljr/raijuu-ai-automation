'use client';

import { FadeIn } from '@/components/shared/motion';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { HealthPill } from './HealthPill';
import { formatDate } from '@/lib/format/time';
import type { Automation } from '@/lib/db/schema';
import type { HealthState } from '@/lib/portal/health';

export function AutomationsSection({
  rows,
  healthByAutomationId,
}: {
  rows: Automation[];
  healthByAutomationId: Record<number, HealthState>;
}) {
  return (
    <FadeIn direction="up" distance={20} amount={0.1}>
      <section className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
          Automations
        </p>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[color:var(--portal-border)] bg-white p-8 text-center">
            <p className="text-sm font-medium">No automations yet</p>
            <p className="mt-1 text-sm text-neutral-500">
              Raijuu is building your first automations.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[color:var(--portal-border)] bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-[color:var(--portal-border)] bg-[color:var(--portal-surface)] text-left">
                <tr>
                  <Th>Name</Th>
                  <Th>What it does</Th>
                  <Th>Status</Th>
                  <Th>Health</Th>
                  <Th>Live since</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-[color:var(--portal-border)]"
                  >
                    <Td>
                      <span className="font-medium">{r.name}</span>
                    </Td>
                    <Td className="max-w-md text-neutral-600">
                      {r.description ?? '—'}
                    </Td>
                    <Td>
                      <StatusPill status={r.status} />
                    </Td>
                    <Td>
                      <HealthPill state={healthByAutomationId[r.id] ?? 'idle'} />
                    </Td>
                    <Td className="font-mono text-xs text-neutral-500">
                      {formatDate(r.createdAt)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </FadeIn>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle ${className ?? ''}`}>{children}</td>;
}
