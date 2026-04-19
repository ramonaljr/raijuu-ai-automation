import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { aggregateMonth, previousMonth } from '@/lib/cron/aggregate-monthly';
import { timingSafeEqual } from '@/lib/auth/timing';

function verifyCronBearer(authHeader: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  if (!authHeader) return false;
  const m = /^Bearer\s+(.+)$/.exec(authHeader);
  if (!m) return false;
  return timingSafeEqual(m[1].trim(), expected);
}

export async function GET(req: Request) {
  if (!verifyCronBearer(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const summary = await aggregateMonth(previousMonth());
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error('[cron] aggregate-monthly failed', err);
    Sentry.captureException(err, { tags: { route: 'cron/aggregate-monthly' } });
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
