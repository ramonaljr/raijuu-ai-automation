'use client';

import Link from 'next/link';
import { ScaleIn } from '@/components/shared/motion';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { formatRelative } from '@/lib/format/time';
import type { FocusRun, FocusVariant } from './focus';

export function FocusCard({ variant }: { variant: FocusVariant }) {
  return (
    <ScaleIn initialScale={0.97}>
      <section className="rounded-2xl border border-[color:var(--portal-border)] bg-gradient-to-br from-[rgba(77,101,255,0.04)] to-transparent p-8 shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
        {variant.kind === 'draft-welcome' ? (
          <DraftWelcome />
        ) : (
          <LastRun run={variant.run} />
        )}
      </section>
    </ScaleIn>
  );
}

function DraftWelcome() {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--accent)]">
        Build in progress
      </p>
      <h2 className="text-2xl font-semibold tracking-tight">
        We&apos;re building your first automation.
      </h2>
      <p className="max-w-xl text-sm text-neutral-600">
        You&apos;ll see live runs here the moment it goes live. If you need
        anything sooner, your engineer is one email away.
      </p>
      <a
        href="mailto:ramonvallejerajr@gmail.com"
        className="inline-flex items-center text-sm font-medium text-[color:var(--accent)] hover:underline"
      >
        Contact your engineer →
      </a>
    </div>
  );
}

function LastRun({ run }: { run: FocusRun }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
        Last run
      </p>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          {run.automationName}
        </h2>
        <span className="text-sm text-neutral-500">
          {formatRelative(run.startedAt)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <StatusPill status={run.status} />
        <Link
          href="/app/runs"
          className="text-sm font-medium text-[color:var(--accent)] hover:underline"
        >
          View all runs →
        </Link>
      </div>
    </div>
  );
}
