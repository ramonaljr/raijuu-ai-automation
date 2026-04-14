import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import {
  formatDate,
  formatMoneyCents,
  formatRelative,
} from '@/app/admin/_components/formatters';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { getEngagementDetail } from '@/lib/admin/clients';
import {
  getCurrentMonthOutcome,
  listRecentRunsForEngagement,
} from '@/lib/portal/data';
import { NarrativeEditor } from './NarrativeEditor';

export const dynamic = 'force-dynamic';

type RunRow = Awaited<ReturnType<typeof listRecentRunsForEngagement>>[number];

function summarizeOutcome(outcomeJson: unknown): string {
  if (!outcomeJson || typeof outcomeJson !== 'object') return '—';
  const o = outcomeJson as { summary?: unknown };
  if (typeof o.summary === 'string' && o.summary.length > 0) {
    return o.summary.length > 80 ? `${o.summary.slice(0, 80)}…` : o.summary;
  }
  return '—';
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const detail = await getEngagementDetail(id);
  if (!detail) notFound();

  const { engagement, lead, intake } = detail;
  const [recentRuns, currentOutcome] = await Promise.all([
    listRecentRunsForEngagement(engagement.id),
    getCurrentMonthOutcome(engagement.id),
  ]);

  const runColumns: Column<RunRow>[] = [
    { header: 'Automation', cell: (r) => r.automationName },
    { header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
    { header: 'Outcome', cell: (r) => summarizeOutcome(r.outcomeJson) },
    { header: 'Started', cell: (r) => formatRelative(r.startedAt) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/clients" className="text-sm underline">
          ← All clients
        </Link>
      </div>

      <section>
        <h1 className="text-lg font-semibold">{engagement.companyName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-neutral-600">
          <StatusPill status={engagement.status} />
          <span>Started {formatDate(engagement.startedAt)}</span>
          <span>Fee {formatMoneyCents(engagement.monthlyFeeCents)}</span>
          <span>Engagement #{engagement.id}</span>
        </div>
      </section>

      <section className="border rounded-lg p-4">
        <h2 className="text-sm font-medium">Lead</h2>
        {lead ? (
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-neutral-500">Email</dt>
            <dd>{lead.email}</dd>
            <dt className="text-neutral-500">Industry</dt>
            <dd>{lead.industry}</dd>
            <dt className="text-neutral-500">Situation</dt>
            <dd className="whitespace-pre-wrap">{lead.situationText}</dd>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">No lead linked.</p>
        )}
      </section>

      <section className="border rounded-lg p-4">
        <h2 className="text-sm font-medium">Intake</h2>
        {intake ? (
          <p className="mt-2 text-sm">
            Submitted {formatDate(intake.submittedAt)} —{' '}
            <Link href={`/admin/intake/${intake.id}`} className="underline">
              view submission
            </Link>
          </p>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            Not yet submitted. Client needs to complete the onboarding link.
          </p>
        )}
      </section>

      <section className="border rounded-lg p-4">
        <h2 className="text-sm font-medium">
          Monthly narrative — {currentOutcome.month}
        </h2>
        <div className="mt-3">
          <NarrativeEditor
            engagementId={engagement.id}
            month={currentOutcome.month}
            initialValue={currentOutcome.outcome?.narrativeMd ?? ''}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-2">Recent runs</h2>
        <Table
          columns={runColumns}
          rows={recentRuns}
          emptyFallback={
            <EmptyState
              title="No runs yet"
              description="Runs appear here after n8n POSTs to /api/n8n/run-callback for this engagement's automations."
            />
          }
        />
      </section>
    </div>
  );
}
