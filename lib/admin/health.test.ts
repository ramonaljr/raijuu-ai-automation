import { describe, it, expect } from 'vitest';
import { computeHealth } from './health';

describe('computeHealth', () => {
  it('returns unknown for zero runs', () => {
    expect(computeHealth(0, 0)).toBe('unknown');
  });

  it('returns healthy at 100% success', () => {
    expect(computeHealth(20, 0)).toBe('healthy');
  });

  it('returns healthy at the 95% threshold (1 failure in 20)', () => {
    expect(computeHealth(20, 1)).toBe('healthy');
  });

  it('returns degraded just below 95%', () => {
    expect(computeHealth(100, 6)).toBe('degraded');
  });

  it('returns degraded at the 80% threshold', () => {
    expect(computeHealth(10, 2)).toBe('degraded');
  });

  it('returns unhealthy below 80%', () => {
    expect(computeHealth(10, 3)).toBe('unhealthy');
  });

  it('returns unhealthy at 100% failure', () => {
    expect(computeHealth(5, 5)).toBe('unhealthy');
  });
});
