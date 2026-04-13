import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, hashIp, _reset } from './rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => _reset());
  it('allows first 3 hits', () => {
    expect(checkRateLimit('ip1').ok).toBe(true);
    expect(checkRateLimit('ip1').ok).toBe(true);
    expect(checkRateLimit('ip1').ok).toBe(true);
  });
  it('blocks 4th hit', () => {
    checkRateLimit('ip2');
    checkRateLimit('ip2');
    checkRateLimit('ip2');
    expect(checkRateLimit('ip2').ok).toBe(false);
  });
  it('isolates per-ip', () => {
    checkRateLimit('a');
    checkRateLimit('a');
    checkRateLimit('a');
    expect(checkRateLimit('b').ok).toBe(true);
  });
});

describe('hashIp', () => {
  it('returns 16-char hex', async () => {
    const h = await hashIp('127.0.0.1');
    expect(h).toMatch(/^[0-9a-f]{16}$/);
  });
  it('is deterministic', async () => {
    expect(await hashIp('1.2.3.4')).toBe(await hashIp('1.2.3.4'));
  });
  it('differs per ip', async () => {
    expect(await hashIp('1.2.3.4')).not.toBe(await hashIp('5.6.7.8'));
  });
});
