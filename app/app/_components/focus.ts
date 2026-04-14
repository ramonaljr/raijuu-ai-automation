import type { PillStatus } from '@/app/admin/_components/StatusPill';

export type FocusRun = {
  id: number;
  automationName: string;
  status: Extract<PillStatus, 'success' | 'failure' | 'running'>;
  startedAt: Date;
};

export type FocusInput = { lastRun: FocusRun | null };

export type FocusVariant =
  | { kind: 'draft-welcome' }
  | { kind: 'last-run'; run: FocusRun };

export function selectFocusVariant(input: FocusInput): FocusVariant {
  if (input.lastRun) return { kind: 'last-run', run: input.lastRun };
  return { kind: 'draft-welcome' };
}
