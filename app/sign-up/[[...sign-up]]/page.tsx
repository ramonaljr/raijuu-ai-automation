import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import AuthShell from '@/components/auth/AuthShell';
import { clerkAppearance } from '@/components/auth/clerkAppearance';

export default function Page() {
  return (
    <AuthShell
      title="Create your account"
      footerSlot={
        <span>
          Already have one?{' '}
          <Link href="/sign-in" className="text-[#6b7fff] hover:text-[#93c5fd]">
            Sign in
          </Link>
        </span>
      }
    >
      <SignUp appearance={clerkAppearance} />
    </AuthShell>
  );
}
