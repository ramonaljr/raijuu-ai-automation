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
    const chain = { from: vi.fn().mockResolvedValue([{ value: 0 }]) };
    (db.select as any).mockReturnValue(chain);
    const result = await getOverviewCounts();
    expect(result).toEqual({
      leads: 0,
      engagements: 0,
      automations: 0,
      intakeSubmissions: 0,
    });
  });
});
