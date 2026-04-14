import type { EngagementHealth } from '@/lib/admin/health';

const style: Record<EngagementHealth, { cls: string; label: string }> = {
  healthy: {
    cls: 'bg-green-100 text-green-800 border-green-200',
    label: 'healthy',
  },
  degraded: {
    cls: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'degraded',
  },
  unhealthy: {
    cls: 'bg-red-100 text-red-800 border-red-200',
    label: 'unhealthy',
  },
  unknown: {
    cls: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    label: 'no runs',
  },
};

export function HealthPill({ health }: { health: EngagementHealth }) {
  const s = style[health];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${s.cls}`}
      title="Health = success rate over runs in the last 7 days"
    >
      {s.label}
    </span>
  );
}
