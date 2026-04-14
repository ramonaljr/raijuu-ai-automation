import { describe, it, expect } from 'vitest';
import { selectFocusVariant } from './focus';

describe('selectFocusVariant', () => {
  it('returns "draft-welcome" when no runs exist', () => {
    expect(selectFocusVariant({ lastRun: null })).toEqual({
      kind: 'draft-welcome',
    });
  });
  it('returns "last-run" wrapping the run when one exists', () => {
    const lastRun = {
      id: 1,
      automationName: 'Daily Inbox Triage',
      status: 'success' as const,
      startedAt: new Date('2026-04-14T10:00:00Z'),
    };
    expect(selectFocusVariant({ lastRun })).toEqual({
      kind: 'last-run',
      run: lastRun,
    });
  });
});
