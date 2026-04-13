import { db } from '@/lib/db';
import { engagements } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export function buildMagicLinkUrl(baseUrl: string, engagementId: number, token: string): string {
  const u = new URL(`/onboard/${engagementId}`, baseUrl);
  u.searchParams.set('token', token);
  return u.toString();
}

export async function verifyMagicLink(
  engagementId: number,
  token: string,
): Promise<{ ok: true } | { ok: false; reason: 'not-found' | 'token-mismatch' | 'already-submitted' }> {
  if (!token || typeof token !== 'string' || token.length < 16) return { ok: false, reason: 'token-mismatch' };
  const rows = await db.select().from(engagements).where(eq(engagements.id, engagementId)).limit(1);
  const engagement = rows[0];
  if (!engagement) return { ok: false, reason: 'not-found' };
  if (engagement.magicLinkToken !== token) return { ok: false, reason: 'token-mismatch' };
  if (engagement.status !== 'onboarding') return { ok: false, reason: 'already-submitted' };
  return { ok: true };
}
