import { describe, it, expect } from 'vitest';
import { readPreferences, DEFAULT_PREFERENCES } from './preferences';

describe('readPreferences', () => {
  it('returns defaults when user is null', () => {
    expect(readPreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });
  it('returns defaults when publicMetadata has no preferences key', () => {
    expect(readPreferences({ publicMetadata: {} } as never)).toEqual(
      DEFAULT_PREFERENCES,
    );
  });
  it('honors stored boolean preferences', () => {
    expect(
      readPreferences({
        publicMetadata: {
          preferences: { notifyOnFailure: false, notifyOnDigest: true },
        },
      } as never),
    ).toEqual({ notifyOnFailure: false, notifyOnDigest: true });
  });
  it('falls back for malformed non-boolean values', () => {
    expect(
      readPreferences({
        publicMetadata: {
          preferences: { notifyOnFailure: 'yes', notifyOnDigest: 1 },
        },
      } as never),
    ).toEqual(DEFAULT_PREFERENCES);
  });
  it('falls back per-field when only one is set', () => {
    expect(
      readPreferences({
        publicMetadata: { preferences: { notifyOnFailure: false } },
      } as never),
    ).toEqual({ notifyOnFailure: false, notifyOnDigest: false });
  });
});
