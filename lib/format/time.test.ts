import { describe, it, expect } from 'vitest';
import { formatDate, formatRelative, formatCountdown, formatMoneyCents } from './time';

describe('formatDate', () => {
  it('returns em-dash for null/undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
  it('formats a Date as ISO YYYY-MM-DD', () => {
    expect(formatDate(new Date('2026-04-14T12:00:00Z'))).toBe('2026-04-14');
  });
  it('accepts an ISO string', () => {
    expect(formatDate('2026-04-14T00:00:00Z')).toBe('2026-04-14');
  });
});

describe('formatRelative', () => {
  const now = new Date('2026-04-14T12:00:00Z');
  it('returns em-dash for null', () => {
    expect(formatRelative(null, now)).toBe('—');
  });
  it('returns "just now" for <60s', () => {
    expect(formatRelative(new Date('2026-04-14T11:59:30Z'), now)).toBe('just now');
  });
  it('returns minutes for <1h', () => {
    expect(formatRelative(new Date('2026-04-14T11:30:00Z'), now)).toBe('30m ago');
  });
  it('returns hours for <24h', () => {
    expect(formatRelative(new Date('2026-04-14T06:00:00Z'), now)).toBe('6h ago');
  });
  it('returns days otherwise', () => {
    expect(formatRelative(new Date('2026-04-10T12:00:00Z'), now)).toBe('4d ago');
  });
});

describe('formatCountdown', () => {
  const now = new Date('2026-04-14T12:00:00Z');
  it('returns em-dash for null', () => {
    expect(formatCountdown(null, now)).toBe('—');
  });
  it('returns "now" for past or imminent targets', () => {
    expect(formatCountdown(new Date('2026-04-14T11:59:59Z'), now)).toBe('now');
  });
  it('returns "Xm" for <1h future', () => {
    expect(formatCountdown(new Date('2026-04-14T12:30:00Z'), now)).toBe('30m');
  });
  it('returns "Xh Ym" for <24h with remainder', () => {
    expect(formatCountdown(new Date('2026-04-14T15:30:00Z'), now)).toBe('3h 30m');
  });
  it('returns "Xh" for clean hour boundary', () => {
    expect(formatCountdown(new Date('2026-04-14T15:00:00Z'), now)).toBe('3h');
  });
  it('returns "Xd Yh" for multi-day with remainder', () => {
    expect(formatCountdown(new Date('2026-04-16T18:00:00Z'), now)).toBe('2d 6h');
  });
  it('returns "Xd" for clean day boundary', () => {
    expect(formatCountdown(new Date('2026-04-16T12:00:00Z'), now)).toBe('2d');
  });
});

describe('formatMoneyCents', () => {
  it('returns em-dash for null', () => {
    expect(formatMoneyCents(null)).toBe('—');
    expect(formatMoneyCents(undefined)).toBe('—');
  });
  it('formats cents as USD currency', () => {
    expect(formatMoneyCents(12345)).toBe('$123.45');
  });
});
