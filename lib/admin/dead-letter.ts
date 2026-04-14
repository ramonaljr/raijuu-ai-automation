import { desc, isNull, and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { webhookDeadLetter } from '@/lib/db/schema';

export async function listDeadLetters(opts: { resolved?: boolean } = {}) {
  const base = db
    .select({
      id: webhookDeadLetter.id,
      source: webhookDeadLetter.source,
      errorMessage: webhookDeadLetter.errorMessage,
      receivedAt: webhookDeadLetter.receivedAt,
      resolvedAt: webhookDeadLetter.resolvedAt,
      retryCount: webhookDeadLetter.retryCount,
    })
    .from(webhookDeadLetter);
  const rows = opts.resolved
    ? await base.orderBy(desc(webhookDeadLetter.receivedAt)).limit(200)
    : await base
        .where(isNull(webhookDeadLetter.resolvedAt))
        .orderBy(desc(webhookDeadLetter.receivedAt))
        .limit(200);
  return rows;
}

export async function getDeadLetter(id: number) {
  const [row] = await db
    .select()
    .from(webhookDeadLetter)
    .where(eq(webhookDeadLetter.id, id))
    .limit(1);
  return row ?? null;
}

export async function markDeadLetterResolved(
  id: number,
  opts: { incrementRetry?: boolean } = {},
) {
  const current = await getDeadLetter(id);
  if (!current) return;
  await db
    .update(webhookDeadLetter)
    .set({
      resolvedAt: new Date(),
      retryCount: opts.incrementRetry
        ? current.retryCount + 1
        : current.retryCount,
    })
    .where(
      and(eq(webhookDeadLetter.id, id), isNull(webhookDeadLetter.resolvedAt)),
    );
}
