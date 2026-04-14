'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const preferencesSchema = z.object({
  notifyOnFailure: z.boolean(),
  notifyOnDigest: z.boolean(),
});

export type UpdatePreferencesResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updatePreferences(
  input: unknown,
): Promise<UpdatePreferencesResult> {
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid preferences payload.' };
  }

  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'Not signed in.' };

  const client = await clerkClient();
  const existing = await client.users.getUser(userId);
  const nextMetadata = {
    ...(existing.publicMetadata ?? {}),
    preferences: parsed.data,
  };

  await client.users.updateUser(userId, { publicMetadata: nextMetadata });
  revalidatePath('/app/settings');
  return { ok: true };
}
