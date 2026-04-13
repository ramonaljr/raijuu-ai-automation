import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { getEngagementForUser } from '@/lib/portal/engagement';

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
  if (result.kind === 'no-match' || result.kind === 'multiple-matches') {
    redirect('/no-engagement');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <nav className="flex gap-6 text-sm">
          <Link href="/app">Automations</Link>
          <Link href="/app/runs">Runs</Link>
          <Link href="/app/reports">Reports</Link>
        </nav>
        <UserButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
