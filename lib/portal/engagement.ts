import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { engagements, leads, type Engagement } from '@/lib/db/schema';

export type ClaimOutcome =
  | { kind: 'claimed'; engagement: Engagement }
  | { kind: 'already-claimed'; engagement: Engagement }
  | { kind: 'no-match' }
  | { kind: 'multiple-matches' };

export async function getEngagementForUser(
  userId: string,
  email: string,
): Promise<ClaimOutcome> {
  // 1. Already claimed by this user?
  const [existing] = await db
    .select()
    .from(engagements)
    .where(eq(engagements.clerkUserId, userId))
    .limit(1);
  if (existing) return { kind: 'already-claimed', engagement: existing };

  // 2. Find unclaimed engagements for this email
  const candidates = await db
    .select({ engagement: engagements })
    .from(engagements)
    .innerJoin(leads, eq(engagements.leadId, leads.id))
    .where(and(eq(leads.email, email), isNull(engagements.clerkUserId)));

  if (candidates.length === 0) return { kind: 'no-match' };
  if (candidates.length > 1) return { kind: 'multiple-matches' };

  // 3. Atomic claim with WHERE clerk_user_id IS NULL guard
  const target = candidates[0].engagement;
  const [claimed] = await db
    .update(engagements)
    .set({ clerkUserId: userId })
    .where(and(eq(engagements.id, target.id), isNull(engagements.clerkUserId)))
    .returning();

  // If another request claimed it between our SELECT and UPDATE, claimed will be undefined
  if (!claimed) return { kind: 'no-match' };
  return { kind: 'claimed', engagement: claimed };
}
