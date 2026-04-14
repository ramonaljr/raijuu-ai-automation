export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function formatRelative(
  d: Date | string | null | undefined,
  now: Date = new Date(),
): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  const deltaSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (deltaSec < 60) return 'just now';
  const deltaMin = Math.floor(deltaSec / 60);
  if (deltaMin < 60) return `${deltaMin}m ago`;
  const deltaHr = Math.floor(deltaMin / 60);
  if (deltaHr < 24) return `${deltaHr}h ago`;
  const deltaDay = Math.floor(deltaHr / 24);
  return `${deltaDay}d ago`;
}

export function formatCountdown(
  target: Date | string | null | undefined,
  now: Date = new Date(),
): string {
  if (!target) return '—';
  const date = typeof target === 'string' ? new Date(target) : target;
  const deltaSec = Math.floor((date.getTime() - now.getTime()) / 1000);
  if (deltaSec <= 0) return 'now';
  const min = Math.floor(deltaSec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) {
    const remMin = min % 60;
    return remMin === 0 ? `${hr}h` : `${hr}h ${remMin}m`;
  }
  const day = Math.floor(hr / 24);
  const remHr = hr % 24;
  return remHr === 0 ? `${day}d` : `${day}d ${remHr}h`;
}

export function formatMoneyCents(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
