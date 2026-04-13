import { describe, it, expect } from 'vitest';
import { getRole } from './roles';

describe('getRole', () => {
  it('returns admin when metadata role is admin', () => {
    expect(getRole({ publicMetadata: { role: 'admin' } } as any)).toBe('admin');
  });
  it('returns client when metadata role is client', () => {
    expect(getRole({ publicMetadata: { role: 'client' } } as any)).toBe('client');
  });
  it('returns null for unknown role', () => {
    expect(getRole({ publicMetadata: { role: 'hacker' } } as any)).toBeNull();
  });
  it('returns null for null user', () => {
    expect(getRole(null)).toBeNull();
  });
});
