import type { HealthState } from '@/lib/portal/health';

const labels: Record<HealthState, string> = {
  healthy: 'healthy',
  flaky: 'flaky',
  failing: 'failing',
  idle: 'idle',
};

const variants: Record<HealthState, string> = {
  healthy: 'bg-green-100 text-green-800 border-green-200',
  flaky: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  failing: 'bg-red-100 text-red-800 border-red-200',
  idle: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

export function HealthPill({ state }: { state: HealthState }) {
  return (
    <span
      title={`Last 7 days: ${labels[state]}`}
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${variants[state]}`}
    >
      {labels[state]}
    </span>
  );
}
