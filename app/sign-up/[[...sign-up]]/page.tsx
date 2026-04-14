import type { Metadata } from 'next';
import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import AuthShell from '@/components/auth/AuthShell';
import { clerkAppearance } from '@/components/auth/clerkAppearance';

export const metadata: Metadata = {
  title: 'Create your account | Raijuu',
};

export default function Page() {
  return (
    <AuthShell
      title="Create your account"
      footerSlot={
        <span>
          Already have one?{' '}
          <Link href="/sign-in" className="text-accent-light hover:text-[#93c5fd]">
            Sign in
          </Link>
        </span>
      }
    >
      <SignUp appearance={clerkAppearance} />
    </AuthShell>
  );
}
