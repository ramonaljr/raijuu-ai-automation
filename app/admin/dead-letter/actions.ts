'use server';

import { currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getRole } from '@/lib/auth/roles';
import {
  getDeadLetter,
  markDeadLetterResolved,
} from '@/lib/admin/dead-letter';

const schema = z.object({
  id: z.number().int().positive(),
});

export type Result = { ok: true } | { ok: false; error: string };

/**
 * "Resolve" marks the dead-letter entry as handled without re-processing. Use
 * this for payloads you've already fixed manually or determined are noise.
 */
export async function resolveDeadLetter(input: unknown): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: 'not-signed-in' };
  if (getRole(user) !== 'admin') return { ok: false, error: 'forbidden' };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const row = await getDeadLetter(parsed.data.id);
  if (!row) return { ok: false, error: 'not-found' };
  if (row.resolvedAt) return { ok: true };

  await markDeadLetterResolved(parsed.data.id);
  revalidatePath('/admin/dead-letter');
  return { ok: true };
}

/**
 * "Retry" re-posts the original payload against /api/n8n/run-callback. The
 * endpoint is idempotent on n8n_execution_id, so a replay of a payload that
 * actually succeeded later won't create duplicates. If the retry succeeds,
 * we mark the entry resolved; if it fails again, we leave it open and bump
 * retry_count so the admin can see the history.
 */
export async function retryDeadLetter(input: unknown): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: 'not-signed-in' };
  if (getRole(user) !== 'admin') return { ok: false, error: 'forbidden' };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const row = await getDeadLetter(parsed.data.id);
  if (!row) return { ok: false, error: 'not-found' };
  if (row.resolvedAt) return { ok: true };

  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return { ok: false, error: 'n8n-webhook-secret-missing' };

  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/n8n/run-callback`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(row.payload),
  });

  if (res.ok) {
    await markDeadLetterResolved(parsed.data.id, { incrementRetry: true });
    revalidatePath('/admin/dead-letter');
    return { ok: true };
  }

  // Retry failed — leave the row open but the user already sees this via the
  // page reload. Don't bump retry_count here since markDeadLetterResolved is
  // the gate; the admin can kick it again after fixing the payload upstream.
  revalidatePath('/admin/dead-letter');
  return { ok: false, error: `retry-failed-${res.status}` };
}
