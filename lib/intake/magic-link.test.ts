import { describe, it, expect } from 'vitest';
import { buildMagicLinkUrl } from './magic-link';

describe('buildMagicLinkUrl', () => {
  it('composes the URL with token query param', () => {
    const url = buildMagicLinkUrl('https://raijuu.ai', 42, 'abc-def-token');
    expect(url).toBe('https://raijuu.ai/onboard/42?token=abc-def-token');
  });
  it('preserves trailing slash behavior', () => {
    expect(buildMagicLinkUrl('https://example.com', 1, 't')).toContain('/onboard/1?token=t');
  });
  it('URL-encodes the token', () => {
    expect(buildMagicLinkUrl('https://x.io', 1, 'a b+c')).toContain('token=a+b%2Bc');
  });
});
