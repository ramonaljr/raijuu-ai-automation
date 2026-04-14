# Portal Premium-Cinematic Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the client portal surface (`/app`, `/app/runs`, `/app/reports`, `/no-engagement`, `/sign-in`) as a premium light-theme dashboard with cinematic brand continuity from the marketing site, built on a reusable `<PortalShell>` with a left sidebar.

**Architecture:** New `<PortalShell>` component composes a fixed 260px left sidebar + centered content area. Portal pages render inside the shell. New portal-only visual primitives (`PageHeader`, `FocusCard`, `PortalTable`) live under `app/app/_components/`. Shared formatters move from `app/admin/_components/formatters.ts` to `lib/format/time.ts` so both surfaces consume one source. Motion reuses existing `components/shared/motion.tsx` primitives. No schema changes. No auth changes.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Framer Motion (already installed), Clerk, Drizzle, Vitest, Playwright.

**Design reference:** `docs/plans/2026-04-14-portal-premium-cinematic-design.md`

**Deviation from design doc:** Focus card has **two** state variants, not three. The "Next scheduled run" variant is deferred because `runs` table has no `scheduledAt` column and n8n-derived scheduling is out of scope for this cycle. Variants delivered: (1) history-based last-run summary, (2) draft-only welcome. Re-introduce the "scheduled" variant once either the schema gains scheduling or n8n exec-preview is wired.

---

## Task 1: Add portal tokens to globals.css

**Files:**
- Modify: `app/globals.css:3-14` (add to `:root`), `app/globals.css:16-29` (add to `@theme inline`)

**Step 1: Add tokens inside `:root`**

Add after line 13 (`--card-border: #e5e7eb;`):

```css
  /* Portal surface tokens */
  --portal-surface: #fafafa;
  --portal-card: #ffffff;
  --portal-border: rgba(10, 10, 10, 0.08);
```

**Step 2: Expose to Tailwind theme**

Add inside `@theme inline` after line 26 (`--color-card-border: var(--card-border);`):

```css
  --color-portal-surface: var(--portal-surface);
  --color-portal-card: var(--portal-card);
  --color-portal-border: var(--portal-border);
```

**Step 3: Verify compilation**

Run: `pnpm exec tsc --noEmit`
Expected: no output (clean).

Run: `pnpm dev` briefly and visit `/` to confirm no regression.
Expected: marketing site renders unchanged.

**Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(portal): add portal-surface/card/border tokens"
```

---

## Task 2: Move shared time formatters to lib/format

**Files:**
- Create: `lib/format/time.ts`
- Create: `lib/format/time.test.ts`
- Modify: all callers of `@/app/admin/_components/formatters` for `formatDate` / `formatRelative`
- Keep: `app/admin/_components/formatters.ts` (re-export wrapper for backward compat, or delete + fix imports)

**Step 1: Write the failing test**

Create `lib/format/time.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatDate, formatRelative, formatCountdown } from './time';

describe('formatDate', () => {
  it('returns em-dash for null/undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
  it('formats a Date as ISO YYYY-MM-DD', () => {
    expect(formatDate(new Date('2026-04-14T12:00:00Z'))).toBe('2026-04-14');
  });
});

describe('formatRelative', () => {
  const now = new Date('2026-04-14T12:00:00Z');
  it('returns em-dash for null', () => {
    expect(formatRelative(null, now)).toBe('—');
  });
  it('returns "just now" for <60s', () => {
    expect(formatRelative(new Date('2026-04-14T11:59:30Z'), now)).toBe('just now');
  });
  it('returns minutes for <1h', () => {
    expect(formatRelative(new Date('2026-04-14T11:30:00Z'), now)).toBe('30m ago');
  });
  it('returns hours for <24h', () => {
    expect(formatRelative(new Date('2026-04-14T06:00:00Z'), now)).toBe('6h ago');
  });
  it('returns days otherwise', () => {
    expect(formatRelative(new Date('2026-04-10T12:00:00Z'), now)).toBe('4d ago');
  });
});

describe('formatCountdown', () => {
  const now = new Date('2026-04-14T12:00:00Z');
  it('returns em-dash for null', () => {
    expect(formatCountdown(null, now)).toBe('—');
  });
  it('returns "now" for past or imminent targets', () => {
    expect(formatCountdown(new Date('2026-04-14T11:59:59Z'), now)).toBe('now');
  });
  it('returns "Xm" for <1h future', () => {
    expect(formatCountdown(new Date('2026-04-14T12:30:00Z'), now)).toBe('30m');
  });
  it('returns "Xh Ym" for <24h', () => {
    expect(formatCountdown(new Date('2026-04-14T15:30:00Z'), now)).toBe('3h 30m');
  });
  it('returns "Xd Yh" for <7d', () => {
    expect(formatCountdown(new Date('2026-04-16T18:00:00Z'), now)).toBe('2d 6h');
  });
});
```

**Step 2: Verify failure**

Run: `pnpm exec vitest run lib/format`
Expected: FAIL — module not found.

**Step 3: Implement `lib/format/time.ts`**

```ts
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function formatRelative(
  d: Date | string | null | undefined,
  now: Date = new Date(),
): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  const deltaSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (deltaSec < 60) return 'just now';
  const deltaMin = Math.floor(deltaSec / 60);
  if (deltaMin < 60) return `${deltaMin}m ago`;
  const deltaHr = Math.floor(deltaMin / 60);
  if (deltaHr < 24) return `${deltaHr}h ago`;
  const deltaDay = Math.floor(deltaHr / 24);
  return `${deltaDay}d ago`;
}

export function formatCountdown(
  target: Date | string | null | undefined,
  now: Date = new Date(),
): string {
  if (!target) return '—';
  const date = typeof target === 'string' ? new Date(target) : target;
  const deltaSec = Math.floor((date.getTime() - now.getTime()) / 1000);
  if (deltaSec <= 0) return 'now';
  const min = Math.floor(deltaSec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) {
    const remMin = min % 60;
    return remMin === 0 ? `${hr}h` : `${hr}h ${remMin}m`;
  }
  const day = Math.floor(hr / 24);
  const remHr = hr % 24;
  return remHr === 0 ? `${day}d` : `${day}d ${remHr}h`;
}

export function formatMoneyCents(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
```

**Step 4: Verify tests pass**

Run: `pnpm exec vitest run lib/format`
Expected: all pass.

**Step 5: Point admin formatters at the shared module**

Replace `app/admin/_components/formatters.ts` contents with re-exports (keeps admin imports working):

```ts
export { formatDate, formatRelative, formatMoneyCents } from '@/lib/format/time';
```

**Step 6: Verify existing tests still pass**

Run: `pnpm exec vitest run`
Expected: 77+ pass (existing admin formatter tests still pass via re-export).

Run: `pnpm exec tsc --noEmit`
Expected: clean.

**Step 7: Commit**

```bash
git add lib/format app/admin/_components/formatters.ts
git commit -m "refactor(format): move time formatters to lib/format for cross-surface use"
```

---

## Task 3: PortalShell sidebar component

**Files:**
- Create: `app/app/_components/PortalShell.tsx`
- Create: `app/app/_components/PortalSidebar.tsx`
- Create: `app/app/_components/PortalSidebar.test.tsx`

**Step 1: Write the failing test**

Create `app/app/_components/PortalSidebar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortalSidebar } from './PortalSidebar';

describe('PortalSidebar', () => {
  it('renders all primary nav items', () => {
    render(
      <PortalSidebar
        engagementName="Acme Co"
        currentPath="/app"
        userEmail="ramon@example.com"
      />,
    );
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Automations')).toBeInTheDocument();
    expect(screen.getByText('Runs')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('marks the active route with aria-current', () => {
    render(
      <PortalSidebar
        engagementName="Acme Co"
        currentPath="/app/runs"
        userEmail="ramon@example.com"
      />,
    );
    const runsLink = screen.getByRole('link', { name: /^Runs$/ });
    expect(runsLink).toHaveAttribute('aria-current', 'page');
    const overviewLink = screen.getByRole('link', { name: /^Overview$/ });
    expect(overviewLink).not.toHaveAttribute('aria-current');
  });

  it('displays the engagement name', () => {
    render(
      <PortalSidebar
        engagementName="n8n Smoke Co"
        currentPath="/app"
        userEmail="ramon@example.com"
      />,
    );
    expect(screen.getByText('n8n Smoke Co')).toBeInTheDocument();
  });
});
```

**Step 2: Verify failure**

Run: `pnpm exec vitest run app/app/_components/PortalSidebar`
Expected: FAIL — module not found.

**Step 3: Implement `PortalSidebar.tsx`**

```tsx
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Zap } from 'lucide-react';

const WORKSPACE_ITEMS = [
  { label: 'Overview', href: '/app' },
  { label: 'Automations', href: '/app#automations' },
  { label: 'Runs', href: '/app/runs' },
  { label: 'Reports', href: '/app/reports' },
] as const;

const ACCOUNT_ITEMS = [
  { label: 'Settings', href: '/app/settings' },
  { label: 'Help', href: 'mailto:ramonvallejerajr@gmail.com' },
] as const;

type Props = {
  engagementName: string;
  currentPath: string;
  userEmail: string;
};

function isActive(itemHref: string, currentPath: string): boolean {
  if (itemHref === '/app') return currentPath === '/app';
  if (itemHref.startsWith('/app/')) return currentPath.startsWith(itemHref);
  return false;
}

export function PortalSidebar({ engagementName, currentPath, userEmail }: Props) {
  return (
    <aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-[color:var(--portal-border)] bg-[color:var(--portal-surface)]">
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
```

**Step 4: Verify tests pass**

Run: `pnpm exec vitest run app/app/_components/PortalSidebar`
Expected: all pass.

**Step 5: Implement `PortalShell.tsx`**

Create `app/app/_components/PortalShell.tsx`:

```tsx
import type { ReactNode } from 'react';
import { PortalSidebar } from './PortalSidebar';

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
    <div className="flex min-h-screen bg-[color:var(--portal-surface)]">
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
```

**Step 6: Commit**

```bash
git add app/app/_components
git commit -m "feat(portal): PortalShell + PortalSidebar with active-route highlighting"
```

---

## Task 4: Swap /app/layout.tsx onto PortalShell

**Files:**
- Modify: `app/app/layout.tsx`

**Step 1: Replace layout contents**

```tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getEngagementForUser } from '@/lib/portal/engagement';
import { getEngagementByClerkUserId } from '@/lib/portal/data';
import { PortalShell } from './_components/PortalShell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app');

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) redirect('/no-engagement');

  const result = await getEngagementForUser(user.id, email);
  if (result.kind === 'no-match' || result.kind === 'multiple-matches') {
    redirect('/no-engagement');
  }

  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const hdrs = await headers();
  const currentPath = hdrs.get('x-pathname') ?? '/app';

  return (
    <PortalShell
      engagementName={engagement.companyName}
      currentPath={currentPath}
      userEmail={email}
    >
      {children}
    </PortalShell>
  );
}
```

**Step 2: Wire the x-pathname header**

Check whether Next.js 16 auto-exposes path via `headers()`. Read `node_modules/next/dist/docs/` for any guide on App Router pathname access in server components.

```bash
ls node_modules/next/dist/docs/ 2>/dev/null | head -20
grep -r "x-pathname\|request.url" node_modules/next/dist/docs/ 2>/dev/null | head -10
```

If no built-in, add to `proxy.ts` (Clerk middleware) after the auth gate:

```ts
const reqHeaders = new Headers(req.headers);
reqHeaders.set('x-pathname', req.nextUrl.pathname);
return NextResponse.next({ request: { headers: reqHeaders } });
```

Full updated `proxy.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isClientRoute = createRouteMatcher(['/app(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req) || isClientRoute(req)) {
    const { userId } = await auth();
    if (!userId) return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set('x-pathname', req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: reqHeaders } });
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**Step 3: Start dev, verify sign-in → /app renders shell**

Run: `pnpm dev` in background, visit http://localhost:3000/app after signing in.
Expected: left sidebar visible with engagement name, right content area shows existing automations table content (unstyled content is fine for now).

**Step 4: Commit**

```bash
git add app/app/layout.tsx proxy.ts
git commit -m "feat(portal): swap /app layout onto PortalShell, expose x-pathname"
```

---

## Task 5: PageHeader + FocusCard primitives

**Files:**
- Create: `app/app/_components/PageHeader.tsx`
- Create: `app/app/_components/FocusCard.tsx`
- Create: `app/app/_components/FocusCard.test.tsx`

**Step 1: Write failing test for FocusCard state selector**

Create `app/app/_components/FocusCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FocusCard, selectFocusVariant } from './FocusCard';

describe('selectFocusVariant', () => {
  it('returns "draft-welcome" when no runs exist', () => {
    expect(selectFocusVariant({ lastRun: null })).toEqual({
      kind: 'draft-welcome',
    });
  });
  it('returns "last-run" when a run exists', () => {
    const lastRun = {
      id: 1,
      automationName: 'Daily Inbox Triage',
      status: 'success' as const,
      startedAt: new Date('2026-04-14T10:00:00Z'),
    };
    expect(selectFocusVariant({ lastRun })).toEqual({
      kind: 'last-run',
      run: lastRun,
    });
  });
});

describe('<FocusCard />', () => {
  it('renders draft-welcome copy when no runs', () => {
    render(<FocusCard variant={{ kind: 'draft-welcome' }} />);
    expect(screen.getByText(/building your first automation/i)).toBeInTheDocument();
  });
  it('renders last-run summary when run exists', () => {
    render(
      <FocusCard
        variant={{
          kind: 'last-run',
          run: {
            id: 1,
            automationName: 'Daily Inbox Triage',
            status: 'success',
            startedAt: new Date(Date.now() - 60 * 60 * 1000),
          },
        }}
      />,
    );
    expect(screen.getByText(/Daily Inbox Triage/)).toBeInTheDocument();
    expect(screen.getByText(/1h ago/)).toBeInTheDocument();
  });
});
```

**Step 2: Verify failure**

Run: `pnpm exec vitest run app/app/_components/FocusCard`
Expected: FAIL — module not found.

**Step 3: Implement `FocusCard.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { ScaleIn } from '@/components/shared/motion';
import { StatusPill, type PillStatus } from '@/app/admin/_components/StatusPill';
import { formatRelative } from '@/lib/format/time';

export type FocusRun = {
  id: number;
  automationName: string;
  status: Extract<PillStatus, 'success' | 'failure' | 'running'>;
  startedAt: Date;
};

export type FocusInput = { lastRun: FocusRun | null };

export type FocusVariant =
  | { kind: 'draft-welcome' }
  | { kind: 'last-run'; run: FocusRun };

export function selectFocusVariant(input: FocusInput): FocusVariant {
  if (input.lastRun) return { kind: 'last-run', run: input.lastRun };
  return { kind: 'draft-welcome' };
}

export function FocusCard({ variant }: { variant: FocusVariant }) {
  return (
    <ScaleIn initialScale={0.97}>
      <section
        className="rounded-2xl border border-[color:var(--portal-border)] bg-gradient-to-br from-[rgba(77,101,255,0.04)] to-transparent p-8 shadow-[0_1px_2px_rgba(10,10,10,0.04)]"
      >
        {variant.kind === 'draft-welcome' ? <DraftWelcome /> : <LastRun run={variant.run} />}
      </section>
    </ScaleIn>
  );
}

function DraftWelcome() {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--accent)]">
        Build in progress
      </p>
      <h2 className="text-2xl font-semibold tracking-tight">
        We're building your first automation.
      </h2>
      <p className="max-w-xl text-sm text-neutral-600">
        You'll see live runs here the moment it goes live. If you need anything
        sooner, your engineer is one email away.
      </p>
      <a
        href="mailto:ramonvallejerajr@gmail.com"
        className="inline-flex items-center text-sm font-medium text-[color:var(--accent)] hover:underline"
      >
        Contact your engineer →
      </a>
    </div>
  );
}

function LastRun({ run }: { run: FocusRun }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
        Last run
      </p>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          {run.automationName}
        </h2>
        <span className="text-sm text-neutral-500">
          {formatRelative(run.startedAt)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <StatusPill status={run.status} />
        <Link
          href={`/app/runs`}
          className="text-sm font-medium text-[color:var(--accent)] hover:underline"
        >
          View all runs →
        </Link>
      </div>
    </div>
  );
}
```

**Step 4: Implement `PageHeader.tsx`**

```tsx
'use client';

import { TextReveal } from '@/components/shared/motion';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  reveal = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  reveal?: boolean;
}) {
  const Title = reveal ? (
    <TextReveal as="h1" className="text-4xl font-semibold tracking-tight">
      {title}
    </TextReveal>
  ) : (
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
  );
  return (
    <header className="space-y-2">
      {eyebrow && (
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
          {eyebrow}
        </p>
      )}
      {Title}
      {subtitle && <p className="text-sm text-neutral-600">{subtitle}</p>}
    </header>
  );
}
```

**Step 5: Verify tests pass**

Run: `pnpm exec vitest run app/app/_components/FocusCard`
Expected: all pass.

**Step 6: Commit**

```bash
git add app/app/_components/FocusCard.tsx app/app/_components/FocusCard.test.tsx app/app/_components/PageHeader.tsx
git commit -m "feat(portal): FocusCard with state selector and PageHeader"
```

---

## Task 6: getLastRunForEngagement helper

**Files:**
- Modify: `lib/portal/data.ts`
- Create: `lib/portal/data.test.ts` (if absent; otherwise append)

**Step 1: Check for existing test file**

```bash
ls lib/portal/
```

If `data.test.ts` doesn't exist, create it. Otherwise append the test.

**Step 2: Write failing test**

Add to `lib/portal/data.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getLastRunForEngagement } from './data';

describe('getLastRunForEngagement', () => {
  it('returns null when no runs exist', async () => {
    // This test documents the contract; wire up a real DB fixture
    // later. For now, assert the function is exported and typed.
    expect(typeof getLastRunForEngagement).toBe('function');
  });
});
```

(Full DB fixture tests already exist elsewhere — this is a contract check.)

**Step 3: Verify failure**

Run: `pnpm exec vitest run lib/portal/data`
Expected: FAIL — `getLastRunForEngagement` not exported.

**Step 4: Implement the helper**

Append to `lib/portal/data.ts`:

```ts
export async function getLastRunForEngagement(engagementId: number) {
  const [row] = await db
    .select({
      id: runs.id,
      automationId: runs.automationId,
      automationName: automations.name,
      startedAt: runs.startedAt,
      finishedAt: runs.finishedAt,
      status: runs.status,
      outcomeJson: runs.outcomeJson,
    })
    .from(runs)
    .innerJoin(automations, eq(automations.id, runs.automationId))
    .where(eq(automations.engagementId, engagementId))
    .orderBy(desc(runs.startedAt))
    .limit(1);
  return row ?? null;
}
```

**Step 5: Verify tests pass**

Run: `pnpm exec vitest run lib/portal/data`
Expected: pass.

**Step 6: Commit**

```bash
git add lib/portal/data.ts lib/portal/data.test.ts
git commit -m "feat(portal): getLastRunForEngagement helper"
```

---

## Task 7: Rewire /app/page.tsx with new primitives

**Files:**
- Modify: `app/app/page.tsx`

**Step 1: Replace page contents**

```tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  getEngagementByClerkUserId,
  getLastRunForEngagement,
  listAutomationsForEngagement,
  listRecentRunsForEngagement,
} from '@/lib/portal/data';
import { PageHeader } from './_components/PageHeader';
import { FocusCard, selectFocusVariant, type FocusRun } from './_components/FocusCard';
import { AutomationsSection } from './_components/AutomationsSection';
import { RecentActivity } from './_components/RecentActivity';

export const dynamic = 'force-dynamic';

export default async function PortalHome() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const [lastRun, automations, recentRuns] = await Promise.all([
    getLastRunForEngagement(engagement.id),
    listAutomationsForEngagement(engagement.id),
    listRecentRunsForEngagement(engagement.id),
  ]);

  const focusVariant = selectFocusVariant({
    lastRun: lastRun ? (lastRun as unknown as FocusRun) : null,
  });

  const firstName = user.firstName ?? 'there';

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={engagement.companyName}
        title={`Hi ${firstName} — here's today.`}
        reveal
      />
      <FocusCard variant={focusVariant} />
      {recentRuns.length > 0 && <RecentActivity runs={recentRuns.slice(0, 3)} />}
      <AutomationsSection rows={automations} />
    </div>
  );
}
```

**Step 2: Create `RecentActivity.tsx`**

```tsx
import Link from 'next/link';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { formatRelative } from '@/lib/format/time';
import type { listRecentRunsForEngagement } from '@/lib/portal/data';

type Row = Awaited<ReturnType<typeof listRecentRunsForEngagement>>[number];

export function RecentActivity({ runs }: { runs: Row[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
          Recent activity
        </p>
        <Link href="/app/runs" className="text-xs text-neutral-500 hover:text-foreground">
          View all →
        </Link>
      </div>
      <ul className="divide-y divide-[color:var(--portal-border)] overflow-hidden rounded-xl border border-[color:var(--portal-border)] bg-white">
        {runs.map((r) => (
          <li key={r.id} className="flex items-center gap-4 px-4 py-3">
            <StatusPill status={r.status} />
            <span className="flex-1 truncate text-sm">{r.automationName}</span>
            <span className="font-mono text-xs text-neutral-500">
              {formatRelative(r.startedAt)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

**Step 3: Create `AutomationsSection.tsx`**

```tsx
'use client';

import { StaggerChildren, StaggerItem } from '@/components/shared/motion';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { formatDate } from '@/lib/format/time';
import type { Automation } from '@/lib/db/schema';

export function AutomationsSection({ rows }: { rows: Automation[] }) {
  return (
    <section className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
        Automations
      </p>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[color:var(--portal-border)] bg-white p-8 text-center">
          <p className="text-sm font-medium">No automations yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            Raijuu is building your first automations.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[color:var(--portal-border)] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[color:var(--portal-border)] bg-[color:var(--portal-surface)] text-left">
              <tr>
                <Th>Name</Th>
                <Th>What it does</Th>
                <Th>Status</Th>
                <Th>Live since</Th>
              </tr>
            </thead>
            <StaggerChildren as="tbody" stagger={0.08} amount={0.1}>
              {rows.map((r) => (
                <StaggerItem as="tr" key={r.id} className="border-t border-[color:var(--portal-border)]">
                  <Td>{r.name}</Td>
                  <Td className="max-w-md text-neutral-600">{r.description ?? '—'}</Td>
                  <Td><StatusPill status={r.status} /></Td>
                  <Td className="font-mono text-xs text-neutral-500">{formatDate(r.createdAt)}</Td>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </table>
        </div>
      )}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className ?? ''}`}>{children}</td>;
}
```

**Note:** `StaggerChildren` + `StaggerItem` currently render `<motion.div>`. We need to extend them to accept `as="tbody" | "tr"` so motion can wrap table elements. **Before this task runs, open `components/shared/motion.tsx` and extend both components with an `as` prop**:

For `StaggerChildren`:
```tsx
// Add `as` prop (default "div") and use motion[as] instead of motion.div.
```

For `StaggerItem`:
```tsx
// Same pattern.
```

If extending the motion primitives is non-trivial, fall back to wrapping the `<table>` in a `StaggerChildren` and using `FadeIn` per row (costs a re-render per row but keeps the existing API).

**Step 4: Run dev server, visit /app**

Run: `pnpm dev` in background.
Expected: Overview renders with page header, focus card ("We're building your first automation"), no activity rail (zero runs), automations table with the one seeded "Daily Inbox Triage" row.

**Step 5: Commit**

```bash
git add app/app/page.tsx app/app/_components/RecentActivity.tsx app/app/_components/AutomationsSection.tsx components/shared/motion.tsx
git commit -m "feat(portal): Overview focus view with page header + focus card + activity + automations"
```

---

## Task 8: Polish /app/runs to match shell

**Files:**
- Modify: `app/app/runs/page.tsx`
- Create: `app/app/runs/_components/RunsTable.tsx`

**Step 1: Create RunsTable component**

```tsx
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { formatRelative } from '@/lib/format/time';
import type { listRecentRunsForEngagement } from '@/lib/portal/data';

type Row = Awaited<ReturnType<typeof listRecentRunsForEngagement>>[number];

function summarizeOutcome(outcomeJson: unknown): string {
  if (!outcomeJson || typeof outcomeJson !== 'object') return '—';
  const o = outcomeJson as { summary?: unknown };
  if (typeof o.summary === 'string' && o.summary.length > 0) {
    return o.summary.length > 80 ? `${o.summary.slice(0, 80)}…` : o.summary;
  }
  return '—';
}

export function RunsTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--portal-border)] bg-white p-8 text-center">
        <p className="text-sm font-medium">No runs yet</p>
        <p className="mt-1 text-sm text-neutral-500">
          Run history appears as your automations execute.
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--portal-border)] bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-[color:var(--portal-border)] bg-[color:var(--portal-surface)] text-left">
          <tr>
            <Th>Automation</Th>
            <Th>Status</Th>
            <Th>Outcome</Th>
            <Th>Started</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[color:var(--portal-border)]">
              <Td>{r.automationName}</Td>
              <Td><StatusPill status={r.status} /></Td>
              <Td className="max-w-md text-neutral-600">{summarizeOutcome(r.outcomeJson)}</Td>
              <Td className="font-mono text-xs text-neutral-500">{formatRelative(r.startedAt)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-neutral-500">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className ?? ''}`}>{children}</td>;
}
```

**Step 2: Update runs page**

Replace `app/app/runs/page.tsx`:

```tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getEngagementByClerkUserId, listRecentRunsForEngagement } from '@/lib/portal/data';
import { PageHeader } from '../_components/PageHeader';
import { RunsTable } from './_components/RunsTable';

export const dynamic = 'force-dynamic';

export default async function RunsPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app/runs');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const rows = await listRecentRunsForEngagement(engagement.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Runs"
        subtitle="The 30 most recent executions across your automations."
      />
      <RunsTable rows={rows} />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/app/runs
git commit -m "feat(portal): polish /app/runs with portal shell conventions"
```

---

## Task 9: Polish /app/reports to match shell

**Files:**
- Modify: `app/app/reports/page.tsx`

**Step 1: Replace contents**

```tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getEngagementByClerkUserId, getCurrentMonthOutcome } from '@/lib/portal/data';
import { formatMoneyCents } from '@/lib/format/time';
import { PageHeader } from '../_components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app/reports');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const { month, outcome } = await getCurrentMonthOutcome(engagement.id);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={month} title="Reports" />
      {outcome ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Runs this month" value={String(outcome.runsCount)} />
          <Stat label="Time saved" value={`${outcome.timeSavedMinutes} min`} />
          <Stat label="Dollars influenced" value={formatMoneyCents(outcome.dollarsInfluencedCents)} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[color:var(--portal-border)] bg-white p-8">
          <p className="text-sm font-medium">No report yet</p>
          <p className="mt-1 max-w-xl text-sm text-neutral-600">
            Your first monthly report computes on the 1st of next month. Need a
            snapshot sooner? Ping Raijuu and we'll pull it by hand.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--portal-border)] bg-white p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/app/reports/page.tsx
git commit -m "feat(portal): polish /app/reports with portal shell conventions"
```

---

## Task 10: Redesign /no-engagement

**Files:**
- Modify: `app/no-engagement/layout.tsx`
- Modify: `app/no-engagement/page.tsx`

**Step 1: Update layout**

```tsx
import { UserButton } from '@clerk/nextjs';

export default function NoEngagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--portal-surface)]">
      <header className="flex items-center justify-end border-b border-[color:var(--portal-border)] bg-white px-6 py-3">
        <UserButton />
      </header>
      <main className="mx-auto max-w-xl px-6 py-24">{children}</main>
    </div>
  );
}
```

**Step 2: Update page**

```tsx
export default function NoEngagementPage() {
  return (
    <div className="rounded-2xl border border-[color:var(--portal-border)] bg-white p-10 text-center shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--accent)]">
        One more step
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        We don't have an engagement tied to this email yet.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-neutral-600">
        Either your onboarding link hasn't been used yet, or there's more than
        one record that needs manual review. Either way — email us and we'll
        sort it in a few minutes.
      </p>
      <div className="mt-6">
        <a
          href="mailto:ramonvallejerajr@gmail.com"
          className="inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-neutral-800"
        >
          Email Raijuu
        </a>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/no-engagement
git commit -m "feat(portal): redesign /no-engagement with portal brand"
```

---

## Task 11: Redesign /sign-in with split brand panel

**Files:**
- Modify: `app/sign-in/[[...sign-in]]/page.tsx`

**Step 1: Replace contents**

```tsx
import { SignIn } from '@clerk/nextjs';
import { Zap } from 'lucide-react';

export default function Page() {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center bg-[color:var(--portal-surface)] p-10">
        <SignIn appearance={{ elements: { card: 'shadow-none border border-[color:var(--portal-border)]' } }} />
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
            Sign in to see what's running, what's landing in your inbox, and how
            many hours Raijuu shaved off this week.
          </p>
        </div>
        <p className="font-mono text-xs text-white/40">raijuu.ai</p>
      </aside>
    </div>
  );
}
```

**Step 2: Start dev, visit /sign-in**

Run: `pnpm dev`
Expected: split layout with Clerk form on left, dark brand panel on right.

**Step 3: Commit**

```bash
git add app/sign-in
git commit -m "feat(portal): redesign /sign-in with split brand panel"
```

---

## Task 12: Visual regression snapshots + reduced-motion test

**Files:**
- Create: `tests/visual/portal.spec.ts`

**Step 1: Read existing Playwright setup**

```bash
cat playwright.config.ts
ls tests/
```

**Step 2: Write snapshot spec**

Create `tests/visual/portal.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

// NOTE: requires CLERK_TEST_USER_EMAIL + OTP bypass or test token in env.
// For this cycle, we snapshot signed-out pages and /no-engagement.

test.describe('Portal visual — signed out', () => {
  test('/sign-in renders split brand panel', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page).toHaveScreenshot('sign-in.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
  });
});

test.describe('Reduced motion', () => {
  test('/sign-in honors prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/sign-in');
    await expect(page).toHaveScreenshot('sign-in-reduced-motion.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
  });
});
```

**Step 3: Generate baseline snapshots**

Run: `pnpm exec playwright test tests/visual/portal.spec.ts --update-snapshots`
Expected: snapshots written under `tests/visual/portal.spec.ts-snapshots/`.

**Step 4: Run normally to confirm stability**

Run: `pnpm exec playwright test tests/visual/portal.spec.ts`
Expected: pass against fresh baselines.

**Step 5: Clean up any loose screenshots outside the snapshots dir**

Per user preference (memory: clean up screenshots after inspection):
```bash
find . -name "*.png" -not -path "./node_modules/*" -not -path "./tests/*" -not -path "./public/*" -not -path "./.next/*" -mtime -1
```
Delete any that aren't part of the test artifacts or public assets.

**Step 6: Commit**

```bash
git add tests/visual
git commit -m "test(portal): add Playwright visual snapshots + reduced-motion spec"
```

---

## Task 13: Final sweep — typecheck, tests, cleanup

**Step 1: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: clean.

**Step 2: Full test suite**

Run: `pnpm exec vitest run`
Expected: all pass (expect +6 to +10 new tests vs baseline).

**Step 3: Lint**

Run: `pnpm exec eslint .`
Expected: clean, or fix any new warnings.

**Step 4: Manual smoke in browser**

Run: `pnpm dev` in background.
1. Visit `/` — marketing unchanged.
2. Visit `/sign-in` — split layout.
3. Sign in, visit `/app` — sidebar + focus card + automations.
4. Click `Runs` — new polished runs table.
5. Click `Reports` — stat skeleton or empty state.
6. Toggle OS reduced-motion setting, refresh `/app` — greeting TextReveal disappears instantly.
7. Resize to 375px — sidebar hidden, content scrollable.
8. Sign out, confirm redirect.

**Step 5: Kill dev server, clean up screenshots**

```bash
find . -name "*.png" -not -path "./node_modules/*" -not -path "./tests/*" -not -path "./public/*" -not -path "./.next/*" -delete 2>/dev/null || true
```

**Step 6: Final commit if anything changed**

```bash
git status
# If anything is dirty from the sweep, commit it as a polish pass:
git commit -am "chore(portal): final polish pass"
```

---

## Out of Scope (Tracked for Future Cycles)

- Engagement switcher functionality (visual stub only in this cycle)
- Settings page implementation
- Help page implementation
- Run detail page (`/app/runs/[id]`) visual polish beyond raw dump
- Dark mode toggle
- Mobile drawer animation polish (just a hidden-at-md-breakpoint for now)
- Next-scheduled-run variant on FocusCard (requires schema or n8n exec-preview)
- KPI strip on Overview (introduce once real run history exists)
