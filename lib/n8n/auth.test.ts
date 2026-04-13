import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifyN8nBearer } from './auth';

const ORIGINAL = process.env.N8N_WEBHOOK_SECRET;

describe('verifyN8nBearer', () => {
  beforeEach(() => {
    process.env.N8N_WEBHOOK_SECRET = 'super-secret-value';
  });
  afterEach(() => {
    if (ORIGINAL == null) delete process.env.N8N_WEBHOOK_SECRET;
    else process.env.N8N_WEBHOOK_SECRET = ORIGINAL;
  });

  it('accepts a matching Bearer header', () => {
    expect(verifyN8nBearer('Bearer super-secret-value')).toBe(true);
  });
  it('rejects a wrong secret', () => {
    expect(verifyN8nBearer('Bearer wrong')).toBe(false);
  });
  it('rejects missing header', () => {
    expect(verifyN8nBearer(null)).toBe(false);
  });
  it('rejects malformed header', () => {
    expect(verifyN8nBearer('super-secret-value')).toBe(false);
  });
  it('rejects when env not set', () => {
    delete process.env.N8N_WEBHOOK_SECRET;
    expect(verifyN8nBearer('Bearer anything')).toBe(false);
  });
});
