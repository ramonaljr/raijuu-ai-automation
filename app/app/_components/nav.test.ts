import { describe, it, expect } from 'vitest';
import { isActive } from './nav';

describe('isActive', () => {
  it('matches /app only when currentPath is exactly /app', () => {
    expect(isActive('/app', '/app')).toBe(true);
    expect(isActive('/app', '/app/runs')).toBe(false);
  });
  it('matches /app/runs for itself and its children', () => {
    expect(isActive('/app/runs', '/app/runs')).toBe(true);
    expect(isActive('/app/runs', '/app/runs/123')).toBe(true);
    expect(isActive('/app/runs', '/app/runsomething')).toBe(false);
    expect(isActive('/app/runs', '/app')).toBe(false);
  });
  it('does not match mailto: or external hrefs', () => {
    expect(isActive('mailto:foo@bar.com', '/app')).toBe(false);
  });
});
