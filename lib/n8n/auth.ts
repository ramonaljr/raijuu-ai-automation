import { timingSafeEqual } from '@/lib/auth/timing';

export function verifyN8nBearer(authHeader: string | null): boolean {
  const expected = process.env.N8N_WEBHOOK_SECRET;
  if (!expected) return false;
  if (!authHeader) return false;
  const match = /^Bearer\s+(.+)$/.exec(authHeader);
  if (!match) return false;
  return timingSafeEqual(match[1].trim(), expected);
}
