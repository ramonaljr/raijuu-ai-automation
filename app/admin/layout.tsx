import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <nav className="flex gap-6 text-sm">
          <Link href="/admin/leads">Leads</Link>
          <Link href="/admin/clients">Clients</Link>
          <Link href="/admin/automations">Automations</Link>
          <Link href="/admin/intake">Intake</Link>
        </nav>
        <UserButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
