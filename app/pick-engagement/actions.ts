'use server';

import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { claimEngagementForUser } from '@/lib/portal/engagement';

const schema = z.object({
  engagementId: z.number().int().positive(),
});

export type ClaimResult =
  | { ok: true }
  | { ok: false; error: 'not-signed-in' | 'invalid' | 'not-yours' | 'already-claimed' };

export async function claimEngagement(input: unknown): Promise<ClaimResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: 'not-signed-in' };
  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) return { ok: false, error: 'not-signed-in' };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const result = await claimEngagementForUser(
    parsed.data.engagementId,
    user.id,
    email,
  );

  if (result === 'claimed') {
    redirect('/app');
  }
  return { ok: false, error: result };
}
