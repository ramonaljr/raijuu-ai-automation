import { describe, it, expect } from 'vitest';
import type { User } from '@clerk/nextjs/server';
import { getRole } from './roles';

type UserLike = Pick<User, 'publicMetadata'>;

describe('getRole', () => {
  it('returns admin when metadata role is admin', () => {
    expect(getRole({ publicMetadata: { role: 'admin' } } as UserLike)).toBe('admin');
  });
  it('returns client when metadata role is client', () => {
    expect(getRole({ publicMetadata: { role: 'client' } } as UserLike)).toBe('client');
  });
  it('returns null for unknown role', () => {
    expect(getRole({ publicMetadata: { role: 'hacker' } } as UserLike)).toBeNull();
  });
  it('returns null for null user', () => {
    expect(getRole(null)).toBeNull();
  });
});
