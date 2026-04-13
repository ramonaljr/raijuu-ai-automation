const buckets = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3;

export function checkRateLimit(ipHash: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const hits = (buckets.get(ipHash) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_REQUESTS) {
    buckets.set(ipHash, hits);
    return { ok: false, remaining: 0 };
  }
  hits.push(now);
  buckets.set(ipHash, hits);
  return { ok: true, remaining: MAX_REQUESTS - hits.length };
}

// Test-only
export function _reset() {
  buckets.clear();
}

export async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(
    ip + (process.env.IP_HASH_SALT ?? 'raijuu-default-salt'),
  );
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}
