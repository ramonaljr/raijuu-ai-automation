import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getEngagementByClerkUserId } from '@/lib/portal/data';
import { formatDate } from '@/lib/format/time';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { PageHeader } from '../_components/PageHeader';
import { readPreferences } from './preferences';
import { SUPPORT_EMAIL } from '@/lib/config/support';
import { NotificationsForm } from './NotificationsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app/settings');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const prefs = readPreferences(user);
  const email = user.primaryEmailAddress?.emailAddress ?? '—';
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || email;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Your profile, your engagement, and how you'd like to hear from us."
      />

      <Section title="Profile">
        <Row label="Name" value={displayName} />
        <Row label="Email" value={email} />
        <Row
          label="Account"
          value={
            <Link
              href="/app/settings/profile"
              className="text-[color:var(--accent)] hover:underline"
            >
              Manage in Clerk →
            </Link>
          }
        />
      </Section>

      <Section title="Engagement">
        <Row label="Company" value={engagement.companyName} />
        <Row
          label="Status"
          value={<StatusPill status={engagement.status} />}
        />
        <Row label="Started" value={formatDate(engagement.startedAt)} />
        <Row
          label="Your engineer"
          value={
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[color:var(--accent)] hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          }
        />
      </Section>

      <Section
        title="Notifications"
        description="Raijuu will only email you at the address above."
      >
        <NotificationsForm initial={prefs} />
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
          {title}
        </p>
        {description && (
          <p className="mt-1 text-sm text-neutral-600">{description}</p>
        )}
      </div>
      <div className="rounded-xl border border-[color:var(--portal-border)] bg-white p-6">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[color:var(--portal-border)] py-3 text-sm first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
