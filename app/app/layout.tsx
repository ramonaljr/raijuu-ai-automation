import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getEngagementForUser } from '@/lib/portal/engagement';
import { getEngagementByClerkUserId } from '@/lib/portal/data';
import { PortalShell } from './_components/PortalShell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app');

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) redirect('/no-engagement');

  const result = await getEngagementForUser(user.id, email);
  if (result.kind === 'multiple-matches') {
    redirect('/pick-engagement');
  }
  if (result.kind === 'no-match') {
    redirect('/no-engagement');
  }

  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const hdrs = await headers();
  const currentPath = hdrs.get('x-pathname') ?? '/app';

  return (
    <PortalShell
      engagementName={engagement.companyName}
      currentPath={currentPath}
      userEmail={email}
    >
      {children}
    </PortalShell>
  );
}
