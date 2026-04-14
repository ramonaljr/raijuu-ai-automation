'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Menu, X, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { WORKSPACE_ITEMS, ACCOUNT_ITEMS, isActive } from './nav';

type Props = {
  engagementName: string;
  currentPath: string;
  userEmail: string;
};

export function PortalMobileBar({
  engagementName,
  currentPath,
  userEmail,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-[color:var(--portal-border)] bg-[color:var(--portal-surface)] px-4 md:hidden">
        <Link href="/app" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background">
            <Zap className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Raijuu</span>
        </Link>
        <div className="flex items-center gap-2">
          <UserButton />
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-neutral-100"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 top-14 z-40 bg-black/20 md:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.nav
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="border-b border-[color:var(--portal-border)] bg-white px-4 py-4 shadow-lg"
            >
              <p className="px-1 pb-2 text-xs font-medium text-neutral-700">
                {engagementName}
              </p>
              <Section
                label="Workspace"
                items={WORKSPACE_ITEMS}
                currentPath={currentPath}
                onNavigate={() => setOpen(false)}
              />
              <Section
                label="Account"
                items={ACCOUNT_ITEMS}
                currentPath={currentPath}
                onNavigate={() => setOpen(false)}
              />
              <p className="mt-4 truncate border-t border-[color:var(--portal-border)] px-1 pt-3 text-xs text-neutral-500">
                {userEmail}
              </p>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({
  label,
  items,
  currentPath,
  onNavigate,
}: {
  label: string;
  items: ReadonlyArray<{ label: string; href: string }>;
  currentPath: string;
  onNavigate: () => void;
}) {
  return (
    <div className="mt-3">
      <p className="px-1 pb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isActive(item.href, currentPath);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={[
                  'block rounded-md px-3 py-2 text-sm',
                  active
                    ? 'bg-neutral-100 font-medium text-foreground'
                    : 'text-neutral-700 hover:bg-neutral-100',
                ].join(' ')}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
