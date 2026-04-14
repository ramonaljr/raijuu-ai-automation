import { UserProfile } from '@clerk/nextjs';
import Link from 'next/link';
import { PageHeader } from '../../_components/PageHeader';

export const dynamic = 'force-dynamic';

export default function SettingsProfilePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <Link href="/app/settings" className="hover:underline">
            ← Settings
          </Link>
        }
        title="Profile"
        subtitle="Your name, email, password, and connected accounts — managed by Clerk."
      />
      <div className="rounded-xl border border-[color:var(--portal-border)] bg-white p-4">
        <UserProfile
          appearance={{
            elements: {
              rootBox: 'w-full',
              cardBox: 'shadow-none border-none w-full',
            },
          }}
        />
      </div>
    </div>
  );
}
