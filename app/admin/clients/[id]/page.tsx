import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import {
  formatDate,
  formatMoneyCents,
} from '@/app/admin/_components/formatters';
import { getEngagementDetail } from '@/lib/admin/clients';

export const dynamic = 'force-dynamic';

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
    </div>
  );
}
