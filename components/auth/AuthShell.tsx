// components/auth/AuthShell.tsx
import type { ReactNode } from 'react';
import LiveSystemPanel from './LiveSystemPanel';

type Props = {
  title: string;
  children: ReactNode;
  footerSlot?: ReactNode;
};

export default function AuthShell({ title, children, footerSlot }: Props) {
  return (
    <main className="relative min-h-screen w-full bg-[#0a0a0a] text-white">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[3fr_2fr]">
        {/* Brand panel — hidden on mobile */}
        <section className="relative hidden overflow-hidden md:block">
          <div className="footer-animated-bg absolute inset-0 opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(77,101,255,0.25),transparent_60%)]" />
          <div className="relative z-10 h-full">
            <LiveSystemPanel />
          </div>
        </section>

        {/* Form panel */}
        <section className="flex items-center justify-center bg-[#141414] px-6 py-16">
          <div className="w-full max-w-sm">
            {/* Mobile brand header */}
            <div className="mb-8 md:hidden">
              <div className="font-mono text-xs uppercase tracking-widest text-[#6b7280]">
                Raijuu AI Automation
              </div>
            </div>
            <h1 className="mb-8 text-3xl font-semibold tracking-tight text-white">
              {title}
            </h1>
            <div className="auth-form-slot">{children}</div>
            {footerSlot ? (
              <div className="mt-8 text-sm text-[#9ca3af]">{footerSlot}</div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
