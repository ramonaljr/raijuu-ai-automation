import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import AuthShell from '@/components/auth/AuthShell';
import { clerkAppearance } from '@/components/auth/clerkAppearance';

export default function Page() {
  return (
    <AuthShell
      title="Welcome back"
      footerSlot={
        <span>
          New to Raijuu?{' '}
          <Link href="/sign-up" className="text-[#6b7fff] hover:text-[#93c5fd]">
            Create an account
          </Link>
        </span>
      }
    >
      <SignIn appearance={clerkAppearance} />
    </AuthShell>
  );
}
