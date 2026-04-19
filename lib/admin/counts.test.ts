import { describe, it, expect, vi } from 'vitest';
import { getOverviewCounts } from './counts';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('getOverviewCounts', () => {
  it('returns numeric counts for each surface', async () => {
    const { db } = await import('@/lib/db');
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ value: 0 }]),
    };
    // `from` returns the chain so `.from(...).where(...)` can resolve; for
    // calls without `.where`, awaiting the chain goes through its thenable
    // via `from` resolving directly.
    (chain.from as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return Object.assign(Promise.resolve([{ value: 0 }]), chain);
    });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);
    const result = await getOverviewCounts();
    expect(result).toEqual({
      leads: 0,
      engagements: 0,
      automations: 0,
      intakeSubmissions: 0,
      openDeadLetters: 0,
    });
  });
});
