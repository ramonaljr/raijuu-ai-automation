import { SignIn } from '@clerk/nextjs';
import { Zap } from 'lucide-react';

export default function Page() {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center bg-[color:var(--portal-surface)] p-10">
        <SignIn
          appearance={{
            elements: {
              card: 'shadow-none border border-[color:var(--portal-border)]',
            },
          }}
        />
      </div>
      <aside className="hidden flex-col justify-between bg-[color:var(--dark-bg)] p-12 text-white md:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
            <Zap className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Raijuu</span>
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
            The workspace
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Your automations, live in one place.
          </h2>
          <p className="max-w-sm text-sm text-white/70">
            Sign in to see what&apos;s running, what&apos;s landing in your
            inbox, and how many hours Raijuu shaved off this week.
          </p>
        </div>
        <p className="font-mono text-xs text-white/40">raijuu.ai</p>
      </aside>
    </div>
  );
}
