import { describe, it, expect, afterEach } from 'vitest';
import { outboundEmailDisabled } from './disabled';

describe('outboundEmailDisabled', () => {
  const original = process.env.DISABLE_OUTBOUND_EMAIL;
  afterEach(() => {
    process.env.DISABLE_OUTBOUND_EMAIL = original;
  });

  it('is disabled when set to "1"', () => {
    process.env.DISABLE_OUTBOUND_EMAIL = '1';
    expect(outboundEmailDisabled()).toBe(true);
  });

  it('is disabled when set to "true"', () => {
    process.env.DISABLE_OUTBOUND_EMAIL = 'true';
    expect(outboundEmailDisabled()).toBe(true);
  });

  it('is enabled when unset', () => {
    delete process.env.DISABLE_OUTBOUND_EMAIL;
    expect(outboundEmailDisabled()).toBe(false);
  });

  it('is enabled for any other truthy-looking string', () => {
    process.env.DISABLE_OUTBOUND_EMAIL = 'yes';
    expect(outboundEmailDisabled()).toBe(false);
  });
});
