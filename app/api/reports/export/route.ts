import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  getEngagementByClerkUserId,
  getOutcomeForMonth,
  currentUtcMonth,
} from '@/lib/portal/data';
import { formatMoneyCents } from '@/lib/format/time';

const MONTH_RE = /^\d{4}-\d{2}$/;

// RFC 4180: double any embedded double-quotes, wrap in quotes if the field
// contains comma, newline, or quote. Keep small and inline — we only have
// two rows of data, no need for a csv dep.
function csvField(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) {
    return NextResponse.json({ error: 'no-engagement' }, { status: 404 });
  }

  const url = new URL(req.url);
  const raw = url.searchParams.get('month');
  const month = raw && MONTH_RE.test(raw) ? raw : currentUtcMonth();

  const { outcome } = await getOutcomeForMonth(engagement.id, month);

  const header = [
    'month',
    'company',
    'runs_count',
    'time_saved_minutes',
    'dollars_influenced',
    'narrative',
  ];
  const row = outcome
    ? [
        month,
        engagement.companyName,
        outcome.runsCount,
        outcome.timeSavedMinutes,
        formatMoneyCents(outcome.dollarsInfluencedCents),
        outcome.narrativeMd ?? '',
      ]
    : [month, engagement.companyName, 0, 0, formatMoneyCents(0), ''];

  const csv =
    header.join(',') + '\n' + row.map(csvField).join(',') + '\n';

  const filename = `raijuu-report-${month}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}
