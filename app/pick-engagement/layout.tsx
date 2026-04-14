import { UserButton } from '@clerk/nextjs';

export default function PickEngagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[color:var(--portal-surface)]">
      <header className="flex items-center justify-end border-b border-[color:var(--portal-border)] bg-white px-6 py-3">
        <UserButton />
      </header>
      <main className="mx-auto max-w-xl px-6 py-24">{children}</main>
    </div>
  );
}
