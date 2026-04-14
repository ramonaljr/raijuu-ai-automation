# Auth Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the bare Clerk `<SignIn />` / `<SignUp />` pages with a branded, dark, cinematic two-panel shell that matches the marketing aesthetic, while keeping Clerk in charge of all auth flow logic.

**Architecture:** Shared server-component `AuthShell` providing layout + background treatment. Client-component `LiveSystemPanel` rendering a pure-CSS ticker over the existing `.dot-grid` / `.animate-ticker` / mesh gradient vocabulary from `globals.css`. A single `clerkAppearance` token object applied per-page to both `<SignIn />` and `<SignUp />`.

**Tech Stack:** Next.js 16.2.3 App Router · React 19 Server Components · Tailwind 4 · `@clerk/nextjs@^7.0.12` · Vitest · Playwright.

**Design doc:** `docs/plans/2026-04-14-auth-page-redesign-design.md` — read this first.

**Upstream context:**
- `app/globals.css:77` (`.dot-grid`), `:96` (`.animate-ticker`), `:137` (`.hero-mask`), `:176` (`.footer-animated-bg`), `:198` (reduced-motion)
- `app/layout.tsx` — `ClerkProvider` already wraps the whole app
- Per `AGENTS.md`: Next.js 16.x has breaking changes vs training data — check `node_modules/next/dist/docs/` when unsure, especially around Server vs Client components and route segment config.

---

## Pre-flight

### Task 0: Read the design doc and Clerk v7 appearance API

**Files:**
- Read: `docs/plans/2026-04-14-auth-page-redesign-design.md` (full)

**Step 1: Read the design doc**

Read the full design. If anything in this plan contradicts it, the design doc wins — stop and surface the conflict before continuing.

**Step 2: Fetch Clerk appearance docs**

Use the Context7 MCP (`mcp__claude_ai_Context7__resolve-library-id` then `query-docs`) with library `@clerk/nextjs` and query `appearance prop variables elements`. Confirm:
- `appearance.variables.colorPrimary` (and the other `color*` tokens used in this plan) exist in v7
- `appearance.elements` key names for `card`, `headerTitle`, `headerSubtitle`, `socialButtonsBlockButton`
- The prop is accepted on both `<SignIn />` and `<SignUp />`

If any key name has changed in v7, adjust Task 3 below before implementing. No commit — this is research.

**Step 3: Verify the project dev server runs clean**

Run: `pnpm dev` (in a separate terminal). Expected: `Ready` banner, no startup errors. Leave it running for visual checks later. Open `http://localhost:3000/sign-in` — expect the current unstyled Clerk default. This is the before state.

---

## Task 1: Scaffold `components/auth/` and add the appearance token file

**Files:**
- Create: `components/auth/clerkAppearance.ts`
- Create: `components/auth/clerkAppearance.test.ts`

**Step 1: Write the failing test**

```ts
// components/auth/clerkAppearance.test.ts
import { describe, expect, it } from 'vitest';
import { clerkAppearance } from './clerkAppearance';

describe('clerkAppearance', () => {
  it('maps brand tokens to Clerk variables', () => {
    expect(clerkAppearance.variables).toMatchObject({
      colorPrimary: '#4d65ff',
      colorBackground: '#141414',
      colorForeground: '#f9fafb',
      colorInput: '#1f1f1f',
      borderRadius: '0.75rem',
    });
  });

  it('hides the default Clerk header since AuthShell owns the title', () => {
    expect(clerkAppearance.elements?.headerTitle).toContain('hidden');
    expect(clerkAppearance.elements?.headerSubtitle).toContain('hidden');
  });

  it('removes the default card chrome since AuthShell provides framing', () => {
    expect(clerkAppearance.elements?.card).toMatch(/shadow-none|border-0|bg-transparent/);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test components/auth/clerkAppearance.test.ts`
Expected: FAIL with `Cannot find module './clerkAppearance'`.

**Step 3: Write the token object**

```ts
// components/auth/clerkAppearance.ts
import type { Appearance } from '@clerk/types';

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: '#4d65ff',
    colorBackground: '#141414',
    colorForeground: '#f9fafb',
    colorMutedForeground: '#6b7280',
    colorInput: '#1f1f1f',
    colorInputForeground: '#f9fafb',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-geist-sans)',
  },
  elements: {
    card: 'bg-transparent shadow-none border-0',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton:
      'bg-[#1f1f1f] border border-[#2a2a2a] hover:bg-[#262626] text-[#f9fafb]',
    formButtonPrimary: 'bg-[#4d65ff] hover:bg-[#6b7fff]',
    footerActionLink: 'text-[#6b7fff] hover:text-[#93c5fd]',
  },
};
```

Note: `@clerk/types` is a transitive dep of `@clerk/nextjs` — import should resolve. If TS errors on the import, fall back to `import type { Appearance } from '@clerk/nextjs'` (re-exported in v7). If neither resolves, type it as `const clerkAppearance = { ... } as const` and move on — no need to block on types.

**Step 4: Run test to verify it passes**

Run: `pnpm test components/auth/clerkAppearance.test.ts`
Expected: PASS, 3/3.

**Step 5: Commit**

```bash
git add components/auth/clerkAppearance.ts components/auth/clerkAppearance.test.ts
git commit -m "feat(auth): clerk appearance tokens for dark brand shell"
```

---

## Task 2: Build `LiveSystemPanel` (client, CSS-only motion)

**Files:**
- Create: `components/auth/LiveSystemPanel.tsx`
- Create: `components/auth/LiveSystemPanel.test.tsx`

**Step 1: Write the failing test**

```tsx
// components/auth/LiveSystemPanel.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LiveSystemPanel from './LiveSystemPanel';

describe('LiveSystemPanel', () => {
  it('renders the wordmark and tagline', () => {
    render(<LiveSystemPanel />);
    expect(screen.getByText('Raijuu')).toBeInTheDocument();
    expect(screen.getByText(/automation that runs itself/i)).toBeInTheDocument();
  });

  it('renders at least 6 ticker rows', () => {
    render(<LiveSystemPanel />);
    const rows = screen.getAllByTestId('ticker-row');
    expect(rows.length).toBeGreaterThanOrEqual(6);
  });

  it('uses the existing animate-ticker utility class so reduced-motion CSS applies', () => {
    const { container } = render(<LiveSystemPanel />);
    expect(container.querySelector('.animate-ticker')).not.toBeNull();
  });
});
```

If `@testing-library/react` isn't already a dev dep, check `package.json`. If absent, ask before adding — plan fallback is to delete this test file and rely on the Playwright check in Task 5.

**Step 2: Run test to verify it fails**

Run: `pnpm test components/auth/LiveSystemPanel.test.tsx`
Expected: FAIL — component missing.

**Step 3: Write the component**

```tsx
// components/auth/LiveSystemPanel.tsx
'use client';

const RUNS = [
  { client: 'acme-corp', flow: 'invoice-sync', ms: '2.3s' },
  { client: 'contoso', flow: 'lead-routing', ms: '1.1s' },
  { client: 'northwind', flow: 'digest-email', ms: '4.7s' },
  { client: 'initech', flow: 'crm-enrich', ms: '0.9s' },
  { client: 'stark-ind', flow: 'support-triage', ms: '3.4s' },
  { client: 'wayne-ent', flow: 'report-rollup', ms: '5.8s' },
  { client: 'umbrella', flow: 'slack-digest', ms: '1.7s' },
  { client: 'tyrell', flow: 'onboard-email', ms: '2.0s' },
];

export default function LiveSystemPanel() {
  // Duplicate so the linear marquee loops without a visible seam.
  const rows = [...RUNS, ...RUNS];

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden p-12 hero-mask">
      <div className="relative z-10">
        <div className="font-mono text-xs uppercase tracking-widest text-[#6b7280]">
          Raijuu AI Automation
        </div>
        <h1 className="mt-4 text-5xl font-semibold leading-tight text-white">
          Raijuu
        </h1>
        <p className="mt-3 max-w-sm text-lg text-[#9ca3af]">
          Automation that runs itself.
        </p>
      </div>

      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />

      <div className="relative z-10 w-full">
        <div className="mb-3 font-mono text-xs uppercase tracking-widest text-[#6b7280]">
          Live runs
        </div>
        <div className="flex w-[200%] animate-ticker gap-6 font-mono text-sm">
          {rows.map((r, i) => (
            <div
              key={i}
              data-testid="ticker-row"
              className="flex shrink-0 items-center gap-3 rounded-lg border border-[#1f1f1f] bg-[#141414]/60 px-4 py-2 text-[#d1d5db] backdrop-blur"
            >
              <span className="text-[#4d65ff]">▸</span>
              <span>{r.client}</span>
              <span className="text-[#6b7280]">·</span>
              <span>{r.flow}</span>
              <span className="text-[#6b7280]">·</span>
              <span>{r.ms}</span>
              <span className="text-emerald-400">✓</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test components/auth/LiveSystemPanel.test.tsx`
Expected: PASS, 3/3. (Skip this step if `@testing-library/react` wasn't available — covered by Playwright later.)

**Step 5: Commit**

```bash
git add components/auth/LiveSystemPanel.tsx components/auth/LiveSystemPanel.test.tsx
git commit -m "feat(auth): live system panel for auth shell brand column"
```

---

## Task 3: Build `AuthShell` (server component, two-panel layout)

**Files:**
- Create: `components/auth/AuthShell.tsx`
- Create: `components/auth/AuthShell.test.tsx`

**Step 1: Write the failing test**

```tsx
// components/auth/AuthShell.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthShell from './AuthShell';

describe('AuthShell', () => {
  it('renders the title and children', () => {
    render(
      <AuthShell title="Welcome back">
        <div>clerk-form-here</div>
      </AuthShell>,
    );
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByText('clerk-form-here')).toBeInTheDocument();
  });

  it('renders the footer slot when provided', () => {
    render(
      <AuthShell title="Sign in" footerSlot={<a href="/sign-up">Create account</a>}>
        <div />
      </AuthShell>,
    );
    expect(screen.getByRole('link', { name: 'Create account' })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test components/auth/AuthShell.test.tsx`
Expected: FAIL — missing module.

**Step 3: Write the component**

```tsx
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
```

**Step 4: Run test to verify it passes**

Run: `pnpm test components/auth/AuthShell.test.tsx`
Expected: PASS, 2/2.

**Step 5: Commit**

```bash
git add components/auth/AuthShell.tsx components/auth/AuthShell.test.tsx
git commit -m "feat(auth): AuthShell two-panel layout wrapping clerk forms"
```

---

## Task 4: Wire sign-in and sign-up pages to the new shell

**Files:**
- Modify: `app/sign-in/[[...sign-in]]/page.tsx`
- Modify: `app/sign-up/[[...sign-up]]/page.tsx`

**Step 1: Replace `app/sign-in/[[...sign-in]]/page.tsx`**

```tsx
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
```

**Step 2: Replace `app/sign-up/[[...sign-up]]/page.tsx`**

```tsx
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
```

**Step 3: Typecheck + lint**

Run: `pnpm lint`
Expected: zero errors. If Clerk type exports moved in v7 causing a TS error on `clerkAppearance`, resolve per the fallback note in Task 1 (`as const`).

**Step 4: Visual check in browser**

With `pnpm dev` running:
- Open `http://localhost:3000/sign-in` at a desktop viewport (≥1280px). Confirm: dark brand panel on left with ticker + wordmark, dark form panel on right with themed Clerk inputs, primary button indigo, no stark-white card.
- Resize to mobile (<768px). Confirm: brand panel is hidden, form is centered and full-width-comfortable.
- Toggle OS "reduce motion". Reload. Confirm: ticker freezes.
- Visit `http://localhost:3000/sign-up`. Confirm: same shell, title "Create your account", footer links back to sign-in.

If anything in the form area looks cramped or mis-aligned, adjust Tailwind spacing in `AuthShell.tsx` — do not reach into Clerk's internal markup beyond the `appearance.elements` tokens already set.

**Step 5: Commit**

```bash
git add app/sign-in app/sign-up
git commit -m "feat(auth): apply AuthShell to sign-in and sign-up routes"
```

---

## Task 5: Playwright smoke test for both routes

**Files:**
- Create: `tests/e2e/auth-pages.spec.ts`

**Step 1: Write the test**

```ts
// tests/e2e/auth-pages.spec.ts
import { expect, test } from '@playwright/test';

test.describe('auth pages redesign', () => {
  test('sign-in renders brand shell + clerk form', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    // Clerk renders an email/identifier input — the specific label can vary.
    await expect(
      page.locator('input[name="identifier"], input[type="email"]').first(),
    ).toBeVisible();
    // Brand panel ticker rows exist in DOM at desktop sizes.
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByText('Raijuu', { exact: true })).toBeVisible();
  });

  test('sign-up renders the mirrored shell', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('mobile viewport hides the brand panel', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    // On mobile the brand panel (and its wordmark) are not visible.
    await expect(page.getByText('Raijuu', { exact: true })).not.toBeVisible();
  });
});
```

**Step 2: Run the e2e**

Run: `pnpm test:e2e tests/e2e/auth-pages.spec.ts`
Expected: 3/3 pass.

If Playwright complains about a missing base URL, open `playwright.config.ts` and confirm it already points at a dev server. If it spins up `pnpm dev` itself, all good; otherwise start `pnpm dev` first.

**Step 3: Commit**

```bash
git add tests/e2e/auth-pages.spec.ts
git commit -m "test(auth): playwright smoke for redesigned sign-in/up shells"
```

---

## Task 6: Final full-suite verification

**Step 1: Run unit tests**

Run: `pnpm test`
Expected: all green, including the three new `components/auth/*.test.*` files.

**Step 2: Run lint**

Run: `pnpm lint`
Expected: zero errors.

**Step 3: Build**

Run: `pnpm build`
Expected: completes without error. Next.js 16 is strict about `'use client'` boundaries — if build complains about `LiveSystemPanel`, confirm the `'use client'` directive is at the top of the file and the component isn't imported from a server-only context improperly. `AuthShell` is server, `LiveSystemPanel` is client — that's fine because server components can render client children.

**Step 4: Clean up**

Delete any screenshots or Playwright traces generated during visual checks (per repo memory).

**Step 5: Do NOT commit here** — Task 4 and Task 5 already committed the functional changes. This task is verification only.

---

## Rollback plan

If something regresses auth flows, revert with:

```bash
git revert <commit-sha-for-task-4>
```

The original pages were one-liners; restoring them is a single file revert each. The shared `components/auth/*` files can stay in place — they do nothing unless imported.

---

## DRY / YAGNI guardrails

- **Do not** introduce Framer Motion for the ticker — the existing `.animate-ticker` CSS keyframe already handles it and respects reduced-motion automatically.
- **Do not** globally theme `ClerkProvider` in `app/layout.tsx` — out of scope. Per-page `appearance` is the blast radius we agreed on.
- **Do not** add a "recent real activity" fetch to `LiveSystemPanel` — it's decorative. If a future dashboard widget wants that, it'll be a separate component.
- **Do not** create `/forgot-password`, `/reset-password`, or `/verify-email` pages — Clerk's catch-all route renders those inside the same `<SignIn />` component and they'll automatically inherit the new shell.
