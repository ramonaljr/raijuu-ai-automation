import type { User } from '@clerk/nextjs/server';

export type Role = 'admin' | 'client';

export function getRole(user: Pick<User, 'publicMetadata'> | null): Role | null {
  const role = user?.publicMetadata?.role;
  if (role === 'admin' || role === 'client') return role;
  return null;
}
