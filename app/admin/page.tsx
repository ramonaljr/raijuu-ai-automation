import Link from 'next/link';
import { getOverviewCounts } from '@/lib/admin/counts';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const counts = await getOverviewCounts();
  const tiles: Array<{ label: string; href: string; value: number }> = [
    { label: 'Leads', href: '/admin/leads', value: counts.leads },
    { label: 'Clients', href: '/admin/clients', value: counts.engagements },
    { label: 'Automations', href: '/admin/automations', value: counts.automations },
    { label: 'Intake submissions', href: '/admin/intake', value: counts.intakeSubmissions },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className="border rounded-lg p-4 hover:bg-neutral-50"
        >
          <p className="text-xs text-neutral-500 uppercase tracking-wide">
            {t.label}
          </p>
          <p className="mt-2 text-2xl font-semibold">{t.value}</p>
        </Link>
      ))}
    </div>
  );
}
