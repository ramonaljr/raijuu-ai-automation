import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { runs, automations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyN8nBearer } from '@/lib/n8n/auth';
import { writeDeadLetter } from '@/lib/n8n/dead-letter';

const DEAD_LETTER_SOURCE = 'n8n-run-callback';

const bodySchema = z.object({
  n8nExecutionId: z.string().min(1).max(120),
  automationId: z.number().int().positive(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  status: z.enum(['success', 'failure', 'running']),
  outcome: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  if (!verifyN8nBearer(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    await writeDeadLetter({
      source: DEAD_LETTER_SOURCE,
      payload: { note: 'body was not valid json' },
      errorMessage: 'invalid-json',
    });
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    await writeDeadLetter({
      source: DEAD_LETTER_SOURCE,
      payload: raw,
      errorMessage: `zod: ${parsed.error.issues
        .map((i) => `${i.path.join('.')}:${i.message}`)
        .join('; ')}`,
    });
    return NextResponse.json(
      { error: 'invalid', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const [automation] = await db
    .select({ id: automations.id })
    .from(automations)
    .where(eq(automations.id, data.automationId))
    .limit(1);
  if (!automation) {
    await writeDeadLetter({
      source: DEAD_LETTER_SOURCE,
      payload: raw,
      errorMessage: `automation-not-found: id=${data.automationId}`,
    });
    return NextResponse.json({ error: 'automation-not-found' }, { status: 404 });
  }

  try {
    const [inserted] = await db
      .insert(runs)
      .values({
        automationId: data.automationId,
        startedAt: new Date(data.startedAt),
        finishedAt: data.finishedAt ? new Date(data.finishedAt) : null,
        status: data.status,
        outcomeJson: data.outcome ?? null,
        n8nExecutionId: data.n8nExecutionId,
      })
      .returning({ id: runs.id });
    return NextResponse.json({ runId: inserted.id, idempotent: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const causeMessage =
      err instanceof Error && err.cause instanceof Error ? err.cause.message : '';
    if (
      message.includes('runs_n8n_execution_id_uniq') ||
      causeMessage.includes('runs_n8n_execution_id_uniq')
    ) {
      const [existing] = await db
        .select({ id: runs.id })
        .from(runs)
        .where(eq(runs.n8nExecutionId, data.n8nExecutionId))
        .limit(1);
      return NextResponse.json({ runId: existing?.id ?? null, idempotent: true });
    }
    console.error('[n8n-callback] unexpected error', err);
    Sentry.captureException(err, {
      tags: { route: 'n8n-run-callback' },
      extra: { automationId: data.automationId, n8nExecutionId: data.n8nExecutionId },
    });
    await writeDeadLetter({
      source: DEAD_LETTER_SOURCE,
      payload: raw,
      errorMessage: `insert-failed: ${message}`,
    });
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
