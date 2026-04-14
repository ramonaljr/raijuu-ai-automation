import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Zap } from 'lucide-react';
import { WORKSPACE_ITEMS, ACCOUNT_ITEMS, isActive } from './nav';

type Props = {
  engagementName: string;
  currentPath: string;
  userEmail: string;
};

export function PortalSidebar({ engagementName, currentPath, userEmail }: Props) {
  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-r border-[color:var(--portal-border)] bg-[color:var(--portal-surface)] md:flex">
      <Link href="/app" className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
          <Zap className="h-4 w-4" />
        </span>
        <span className="font-semibold tracking-tight">Raijuu</span>
      </Link>

      <div className="px-5 pb-4">
        <div className="flex items-center justify-between rounded-lg border border-[color:var(--portal-border)] bg-white px-3 py-2 text-sm">
          <span className="truncate font-medium">{engagementName}</span>
          <span className="text-neutral-400">⌄</span>
        </div>
      </div>

      <nav className="flex-1 space-y-6 px-3">
        <NavSection label="Workspace" items={WORKSPACE_ITEMS} currentPath={currentPath} />
        <NavSection label="Account" items={ACCOUNT_ITEMS} currentPath={currentPath} />
      </nav>

      <div className="flex items-center gap-3 border-t border-[color:var(--portal-border)] px-4 py-3">
        <UserButton />
        <span className="truncate text-xs text-neutral-500">{userEmail}</span>
      </div>
    </aside>
  );
}

function NavSection({
  label,
  items,
  currentPath,
}: {
  label: string;
  items: ReadonlyArray<{ label: string; href: string }>;
  currentPath: string;
}) {
  return (
    <div>
      <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isActive(item.href, currentPath);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'group relative flex items-center rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-neutral-100 font-medium text-foreground'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-foreground',
                ].join(' ')}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[color:var(--accent)]"
                  />
                )}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
