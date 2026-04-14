import { db } from '@/lib/db';
import { webhookDeadLetter } from '@/lib/db/schema';

/**
 * Persist a failed webhook payload so we don't silently drop it. Best-effort:
 * if the dead-letter write itself throws, we log and return — the caller's
 * response shape is unchanged. Callers should always respond to n8n so it can
 * honour its own retry budget against the live endpoint.
 */
export async function writeDeadLetter(params: {
  source: string;
  payload: unknown;
  errorMessage: string;
}): Promise<void> {
  try {
    await db.insert(webhookDeadLetter).values({
      source: params.source,
      payload: params.payload as object,
      errorMessage: params.errorMessage,
    });
  } catch (err) {
    console.error('[dead-letter] insert failed', err);
  }
}
