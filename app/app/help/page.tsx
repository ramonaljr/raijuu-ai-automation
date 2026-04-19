import { Mail, Clock, AlertTriangle, Book, Zap, MessageSquare } from 'lucide-react';
import { PageHeader } from '../_components/PageHeader';
import { SUPPORT_EMAIL } from '@/lib/config/support';

export const dynamic = 'force-dynamic';

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Where do I see what's running?",
    a: "The Overview page shows your most recent run at a glance. The Runs page shows the last 30 executions across all your automations.",
  },
  {
    q: 'What happens when a run fails?',
    a: "Failed runs show up on Runs with a red status pill. If you've enabled failure alerts in Settings, we'll email you — usually within a minute of the failure. Your engineer is auto-paged for production failures.",
  },
  {
    q: 'How do I request a new automation or change an existing one?',
    a: "Email your engineer directly. Include the goal, the tools involved, and any edge cases. Most scoped changes land within 2 business days.",
  },
  {
    q: 'Can I pause an automation myself?',
    a: "Not yet — by design. Pausing and editing live automations sits on our side so we can keep the impact contained and reviewed. Email your engineer with a pause request and we'll action it within the hour.",
  },
  {
    q: 'Where does the monthly report number come from?',
    a: "We aggregate runs_count, time_saved_minutes, and dollars_influenced_cents on the 1st of each month. The narrative is hand-written by your engineer — not LLM-generated — so it reflects the month you actually had.",
  },
  {
    q: 'How is my data handled?',
    a: "Credentials you hand over during onboarding live in a managed vault, not in our database. Run outcomes are stored to show you history; we don't share them. If you churn, we export and purge on request within 7 days.",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Account"
        title="Help"
        subtitle="Fast answers below. For everything else, we're one email away."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <ContactCard
          icon={<Mail className="h-4 w-4" />}
          title="Your engineer"
          value={SUPPORT_EMAIL}
          href={`mailto:${SUPPORT_EMAIL}`}
          footer="Response within 4 business hours · urgent items ping Raijuu on-call"
        />
        <ContactCard
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Production incident"
          value="Reply to the failure alert email"
          footer="Includes the run ID and a one-click page link to on-call"
        />
      </section>

      <section className="space-y-4">
        <SectionLabel icon={<MessageSquare className="h-3.5 w-3.5" />}>
          Frequently asked
        </SectionLabel>
        <div className="divide-y divide-[color:var(--portal-border)] overflow-hidden rounded-xl border border-[color:var(--portal-border)] bg-white">
          {FAQS.map((item, idx) => (
            <details
              key={idx}
              className="group [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium hover:bg-[color:var(--portal-surface)]">
                <span>{item.q}</span>
                <span className="text-neutral-400 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm text-neutral-600">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionLabel icon={<Clock className="h-3.5 w-3.5" />}>
          What to expect
        </SectionLabel>
        <ul className="space-y-3 text-sm">
          <Bullet label="Build request">
            Scoped in 1 business day. Ship target set after scoping.
          </Bullet>
          <Bullet label="Bug or failed run">
            Acknowledged within 4 business hours; fix in flight within 1 business day.
          </Bullet>
          <Bullet label="Production incident">
            Under 15 minutes to first human response, 24/7.
          </Bullet>
          <Bullet label="Monthly report">
            Lands in your inbox and on /app/reports by the 3rd of each month.
          </Bullet>
        </ul>
      </section>

      <section className="space-y-4">
        <SectionLabel icon={<Book className="h-3.5 w-3.5" />}>
          Resources
        </SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <ResourceLink
            href={`mailto:${SUPPORT_EMAIL}?subject=Automation%20request`}
            title="Request a new automation"
            description="Email template — goals, tools, edge cases"
          />
          <ResourceLink
            href={`mailto:${SUPPORT_EMAIL}?subject=Credential%20rotation`}
            title="Rotate credentials"
            description="We coordinate the vault swap; zero downtime"
          />
        </div>
      </section>
    </div>
  );
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
        {icon}
      </span>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
        {children}
      </p>
    </div>
  );
}

function ContactCard({
  icon,
  title,
  value,
  href,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href?: string;
  footer: string;
}) {
  const valueNode = href ? (
    <a className="hover:underline" href={href}>
      {value}
    </a>
  ) : (
    value
  );
  return (
    <div className="rounded-xl border border-[color:var(--portal-border)] bg-white p-5">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-[color:var(--portal-surface)] text-neutral-600">
          {icon}
        </span>
        {title}
      </div>
      <p className="mt-3 text-sm font-medium text-[color:var(--accent)]">
        {valueNode}
      </p>
      <p className="mt-1 text-xs text-neutral-500">{footer}</p>
    </div>
  );
}

function Bullet({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
      <span>
        <strong className="font-medium">{label}.</strong>{' '}
        <span className="text-neutral-600">{children}</span>
      </span>
    </li>
  );
}

function ResourceLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="group block rounded-xl border border-[color:var(--portal-border)] bg-white p-4 transition-colors hover:border-[color:var(--accent)]/30 hover:bg-[color:var(--portal-surface)]"
    >
      <p className="text-sm font-medium group-hover:text-[color:var(--accent)]">
        {title} →
      </p>
      <p className="mt-1 text-xs text-neutral-500">{description}</p>
    </a>
  );
}
