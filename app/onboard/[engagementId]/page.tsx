import { notFound } from 'next/navigation';
import { verifyMagicLink } from '@/lib/intake/magic-link';
import { db } from '@/lib/db';
import { engagements } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { IntakeFlow } from './IntakeFlow';

export const dynamic = 'force-dynamic';

export default async function OnboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ engagementId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { engagementId: idStr } = await params;
  const { token } = await searchParams;
  const engagementId = Number(idStr);
  if (!Number.isInteger(engagementId) || engagementId <= 0) notFound();

  const check = await verifyMagicLink(engagementId, token ?? '');
  if (!check.ok) {
    return <IntakeGate reason={check.reason} />;
  }

  const [engagement] = await db
    .select()
    .from(engagements)
    .where(eq(engagements.id, engagementId))
    .limit(1);

  if (!engagement) notFound();

  return (
    <IntakeFlow
      engagementId={engagementId}
      token={token!}
      companyName={engagement.companyName}
    />
  );
}

function IntakeGate({ reason }: { reason: string }) {
  const messages: Record<string, string> = {
    'not-found':
      "We can't find that onboarding link. Double-check the email we sent you.",
    'token-mismatch': 'That link is invalid or has been replaced. Ask Raijuu to resend it.',
    'already-submitted':
      "You've already completed onboarding. We're building your automations now.",
  };
  return (
    <main className="min-h-screen bg-dark-bg text-white flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-3">Onboarding link</h1>
        <p className="text-white/60">{messages[reason] ?? 'Unknown issue.'}</p>
      </div>
    </main>
  );
}
