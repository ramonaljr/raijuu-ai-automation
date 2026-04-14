import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { getRole } from '@/lib/auth/roles';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/admin');
  const role = getRole(user);
  if (role !== 'admin') redirect('/sign-in?need=admin');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <nav className="flex gap-6 text-sm">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/leads">Leads</Link>
          <Link href="/admin/clients">Clients</Link>
          <Link href="/admin/automations">Automations</Link>
          <Link href="/admin/intake">Intake</Link>
          <Link href="/admin/dead-letter">Dead-letter</Link>
        </nav>
        <UserButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
