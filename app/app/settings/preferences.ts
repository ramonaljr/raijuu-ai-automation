import type { User } from '@clerk/nextjs/server';

export type Preferences = {
  notifyOnFailure: boolean;
  notifyOnDigest: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  notifyOnFailure: true,
  notifyOnDigest: false,
};

export function readPreferences(
  user: Pick<User, 'publicMetadata'> | null,
): Preferences {
  const raw = user?.publicMetadata as
    | { preferences?: Partial<Preferences> }
    | undefined;
  const p = raw?.preferences ?? {};
  return {
    notifyOnFailure:
      typeof p.notifyOnFailure === 'boolean'
        ? p.notifyOnFailure
        : DEFAULT_PREFERENCES.notifyOnFailure,
    notifyOnDigest:
      typeof p.notifyOnDigest === 'boolean'
        ? p.notifyOnDigest
        : DEFAULT_PREFERENCES.notifyOnDigest,
  };
}
