import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Liveness + DB probe. Railway and any future uptime monitor should hit this.
// Returns 200 only if the DB round-trip succeeds; 503 otherwise so the
// platform can react (restart, alert, etc.) instead of the app serving 500s.
export async function GET() {
  const startedAt = Date.now();
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({
      ok: true,
      db: 'up',
      latencyMs: Date.now() - startedAt,
    });
  } catch {
    return NextResponse.json(
      { ok: false, db: 'down', latencyMs: Date.now() - startedAt },
      { status: 503 },
    );
  }
}
