import { describe, it, expect } from 'vitest';
import { computeAutomationHealth } from './health';

describe('computeAutomationHealth', () => {
  const now = new Date();

  it('returns idle for draft automations', () => {
    expect(
      computeAutomationHealth({ automationStatus: 'draft', runs: [] }),
    ).toBe('idle');
  });

  it('returns idle for paused automations', () => {
    expect(
      computeAutomationHealth({
        automationStatus: 'paused',
        runs: [{ status: 'success', startedAt: now }],
      }),
    ).toBe('idle');
  });

  it('returns failing for live automations with no runs in window', () => {
    expect(
      computeAutomationHealth({ automationStatus: 'live', runs: [] }),
    ).toBe('failing');
  });

  it('returns failing when latest run failed', () => {
    expect(
      computeAutomationHealth({
        automationStatus: 'live',
        runs: [
          { status: 'failure', startedAt: now },
          { status: 'success', startedAt: now },
        ],
      }),
    ).toBe('failing');
  });

  it('returns flaky when latest succeeded but window has a failure', () => {
    expect(
      computeAutomationHealth({
        automationStatus: 'live',
        runs: [
          { status: 'success', startedAt: now },
          { status: 'failure', startedAt: now },
          { status: 'success', startedAt: now },
        ],
      }),
    ).toBe('flaky');
  });

  it('returns healthy when all window runs succeeded', () => {
    expect(
      computeAutomationHealth({
        automationStatus: 'live',
        runs: [
          { status: 'success', startedAt: now },
          { status: 'success', startedAt: now },
        ],
      }),
    ).toBe('healthy');
  });

  it('treats automations in error status as also failing when no recent runs', () => {
    expect(
      computeAutomationHealth({ automationStatus: 'error', runs: [] }),
    ).toBe('failing');
  });
});
