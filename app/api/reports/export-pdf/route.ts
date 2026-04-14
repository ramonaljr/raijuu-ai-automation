import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  getEngagementByClerkUserId,
  getOutcomeForMonth,
  currentUtcMonth,
} from '@/lib/portal/data';
import { renderReportPdf } from '@/lib/reports/pdf';

// @react-pdf/renderer uses node APIs (streams, Buffer) so force node runtime.
export const runtime = 'nodejs';

const MONTH_RE = /^\d{4}-\d{2}$/;

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

  const pdf = await renderReportPdf({
    month,
    companyName: engagement.companyName,
    runsCount: outcome?.runsCount ?? 0,
    timeSavedMinutes: outcome?.timeSavedMinutes ?? 0,
    dollarsInfluencedCents: outcome?.dollarsInfluencedCents ?? 0,
    narrativeMd: outcome?.narrativeMd ?? null,
  });

  const filename = `raijuu-report-${month}.pdf`;
  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'private, no-store',
    },
  });
}
