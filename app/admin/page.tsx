import Link from 'next/link';
import { getOverviewCounts } from '@/lib/admin/counts';
import { getGlobalRunStats } from '@/lib/admin/health';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const [counts, runStats] = await Promise.all([
    getOverviewCounts(),
    getGlobalRunStats(),
  ]);

  const tiles: Array<{
    label: string;
    href: string;
    value: number;
    sub?: string;
    tone?: 'neutral' | 'warn';
  }> = [
    { label: 'Leads', href: '/admin/leads', value: counts.leads },
    { label: 'Clients', href: '/admin/clients', value: counts.engagements },
    {
      label: 'Automations',
      href: '/admin/automations',
      value: counts.automations,
    },
    {
      label: 'Intake submissions',
      href: '/admin/intake',
      value: counts.intakeSubmissions,
    },
    {
      label: 'Failures (7d)',
      href: '/admin/automations',
      value: runStats.failures,
      sub:
        runStats.total === 0
          ? 'No runs yet'
          : `of ${runStats.total} runs (${Math.round(
              ((runStats.total - runStats.failures) / runStats.total) * 100,
            )}% success)`,
      tone: runStats.failures > 0 ? 'warn' : 'neutral',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {tiles.map((t) => (
        <Link
          key={t.label}
          href={t.href}
          className={
            t.tone === 'warn'
              ? 'border border-red-200 bg-red-50 rounded-lg p-4 hover:bg-red-100'
              : 'border rounded-lg p-4 hover:bg-neutral-50'
          }
        >
          <p
            className={
              t.tone === 'warn'
                ? 'text-xs text-red-700 uppercase tracking-wide'
                : 'text-xs text-neutral-500 uppercase tracking-wide'
            }
          >
            {t.label}
          </p>
          <p
            className={
              t.tone === 'warn'
                ? 'mt-2 text-2xl font-semibold text-red-800'
                : 'mt-2 text-2xl font-semibold'
            }
          >
            {t.value}
          </p>
          {t.sub && (
            <p className="mt-1 text-[11px] text-neutral-500">{t.sub}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
