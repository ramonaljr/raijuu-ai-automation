import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { listUnclaimedCandidatesForEmail } from '@/lib/portal/engagement';
import { PickList } from './PickList';

export const dynamic = 'force-dynamic';

export default async function PickEngagementPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/pick-engagement');

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) redirect('/no-engagement');

  const candidates = await listUnclaimedCandidatesForEmail(email);

  if (candidates.length === 0) redirect('/no-engagement');

  return (
    <div className="rounded-2xl border border-[color:var(--portal-border)] bg-white p-10 shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--accent)]">
        Pick an engagement
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        You have {candidates.length} engagements waiting.
      </h1>
      <p className="mt-3 text-sm text-neutral-600">
        Choose which one to open. You can sign out and back in to switch later
        — or email us if you need to merge them.
      </p>
      <div className="mt-8">
        <PickList candidates={candidates} />
      </div>
    </div>
  );
}
