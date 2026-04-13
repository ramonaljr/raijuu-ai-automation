export type PillStatus =
  | 'onboarding' | 'active' | 'paused' | 'churned'
  | 'draft' | 'live' | 'error'
  | 'success' | 'failure' | 'running';

export type PillVariant = 'green' | 'yellow' | 'red' | 'neutral';

export function pillVariantFor(status: PillStatus): PillVariant {
  switch (status) {
    case 'active':
    case 'live':
    case 'success':
      return 'green';
    case 'onboarding':
    case 'running':
      return 'yellow';
    case 'churned':
    case 'error':
    case 'failure':
      return 'red';
    case 'paused':
    case 'draft':
      return 'neutral';
    default:
      return 'neutral';
  }
}

const variantClass: Record<PillVariant, string> = {
  green: 'bg-green-100 text-green-800 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
};

export function StatusPill({ status }: { status: PillStatus }) {
  const variant = pillVariantFor(status);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${variantClass[variant]}`}
    >
      {status}
    </span>
  );
}
