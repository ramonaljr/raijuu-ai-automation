import type { ReactNode } from 'react';
import { PortalSidebar } from './PortalSidebar';
import { PortalMobileBar } from './PortalMobileBar';

export function PortalShell({
  engagementName,
  currentPath,
  userEmail,
  children,
}: {
  engagementName: string;
  currentPath: string;
  userEmail: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--portal-surface)] md:flex-row">
      <PortalMobileBar
        engagementName={engagementName}
        currentPath={currentPath}
        userEmail={userEmail}
      />
      <PortalSidebar
        engagementName={engagementName}
        currentPath={currentPath}
        userEmail={userEmail}
      />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">{children}</div>
      </main>
    </div>
  );
}
