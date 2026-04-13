import { NextResponse } from 'next/server';
import { aggregateMonth, previousMonth } from '@/lib/cron/aggregate-monthly';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

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
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
