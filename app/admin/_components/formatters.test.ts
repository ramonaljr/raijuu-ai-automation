import { describe, it, expect } from 'vitest';
import { formatDate, formatRelative, formatMoneyCents } from './formatters';

describe('formatDate', () => {
  it('renders ISO-like short date in UTC', () => {
    expect(formatDate(new Date('2026-04-14T10:23:00Z'))).toBe('2026-04-14');
  });
  it('returns em-dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });
});

describe('formatRelative', () => {
  it('returns "just now" for <60s', () => {
    const now = new Date();
    const fiveSecsAgo = new Date(now.getTime() - 5_000);
    expect(formatRelative(fiveSecsAgo, now)).toBe('just now');
  });
  it('returns minutes for <1h', () => {
    const now = new Date();
    const t = new Date(now.getTime() - 5 * 60_000);
    expect(formatRelative(t, now)).toBe('5m ago');
  });
  it('returns hours for <24h', () => {
    const now = new Date();
    const t = new Date(now.getTime() - 3 * 3600_000);
    expect(formatRelative(t, now)).toBe('3h ago');
  });
  it('returns days for >=24h', () => {
    const now = new Date();
    const t = new Date(now.getTime() - 2 * 86400_000);
    expect(formatRelative(t, now)).toBe('2d ago');
  });
  it('returns em-dash for null', () => {
    expect(formatRelative(null)).toBe('—');
  });
});

describe('formatMoneyCents', () => {
  it('formats positive cents as USD', () => {
    expect(formatMoneyCents(499_900)).toBe('$4,999.00');
  });
  it('formats zero', () => {
    expect(formatMoneyCents(0)).toBe('$0.00');
  });
  it('returns em-dash for null', () => {
    expect(formatMoneyCents(null)).toBe('—');
  });
});
