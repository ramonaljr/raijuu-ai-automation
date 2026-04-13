# Raijuu Dashboard — Phase 0: Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Land Clerk auth, Neon Postgres + Drizzle ORM, role-based route guards, and empty layout shells for `/app` and `/admin` so Phase 1+ can build features without re-deciding infrastructure.

**Architecture:** Clerk handles identity (email + OTP, role in publicMetadata). Neon hosts Postgres on a free serverless tier with branchable databases for CI. Drizzle provides type-safe queries and migrations. Next.js middleware enforces role gates per route prefix. Layout shells render auth-aware navigation but have no real content yet.

**Tech Stack:** Next.js 16.2.2 (App Router, React 19), Clerk, Neon (Postgres), Drizzle ORM, Drizzle Kit, Zod, pnpm, Vitest.

**Reference design:** `docs/plans/2026-04-13-dashboard-design.md` §4 (Architecture).

**Pre-flight rule (from AGENTS.md):** Next.js 16 has breaking changes from training data. Before writing any Next.js-specific code (middleware, layout, route handlers, server actions), read `node_modules/next/dist/docs/` for the relevant API.

**Known API gotchas in our pinned majors (verified 2026-04-14):**
- **Clerk v7:** middleware is `clerkMiddleware` (NOT `authMiddleware`). Server-side `auth()` is **async** — always `await auth()`. v5/v6 snippets on the web will look correct but silently return a truthy Promise object, causing auth bypasses. Consult Context7 `/clerk/javascript` before writing auth code.
- **Zod v4:** `z.record(V)` now requires `z.record(z.string(), V)`. Error formatting moved (`.format()` → `z.treeifyError`). `.strict()`/`.passthrough()` semantics shifted. Consult Context7 `/colinhacks/zod` before writing schemas.

---

## Phase 0 Scope

In:
- pnpm deps for auth + DB + validation
- Drizzle config + initial schema covering all 6 tables from design §4.3
- Clerk integration with role-based metadata
- `middleware.ts` enforcing `/admin` (admin role) and `/app` (client role)
- Empty layout shells at `/app` and `/admin` with auth-aware nav
- Vitest set up for unit tests
- One smoke E2E test (Playwright) confirming auth gates work

Out (deferred to later phases):
- Demo flow (Phase 1)
- Intake flow (Phase 2)
- Admin views (Phase 3)
- Client portal views (Phase 4)
- n8n webhook handler (Phase 4)
- Email (Resend), Cal.com, Turnstile, Sentry — added when first needed

---

## Manual Pre-Steps (do these once, outside the code loop)

These create external accounts. Do before Task 1.

1. **Neon:** sign up at neon.tech, create project `raijuu`, copy connection string, save as `DATABASE_URL` in `.env.local`. Create a second branch named `ci` for tests.
2. **Clerk:** sign up at clerk.com, create application `Raijuu`, enable **Email + OTP** sign-in, disable other methods. Copy `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` into `.env.local`. In Clerk dashboard → User & Authentication → Metadata, document that `publicMetadata.role` will hold `"admin" | "client"`.
3. Add `.env.local` to `.gitignore` (verify it's already excluded by the Next.js default).

---

### Task 1: Install Phase 0 dependencies

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Install runtime deps**

```bash
pnpm add @clerk/nextjs @neondatabase/serverless drizzle-orm zod
```

**Step 2: Install dev deps**

```bash
pnpm add -D drizzle-kit vitest @vitest/ui dotenv
```

**Step 3: Verify**

Run: `pnpm list --depth=0 | grep -E "(clerk|drizzle|neon|zod|vitest)"`
Expected: all six packages listed with versions.

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: add auth + db + validation deps for Phase 0"
```

---

### Task 2: Create environment template

**Files:**
- Create: `.env.example`

**Step 1: Write the template**

```
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DATABASE_URL_CI=postgresql://user:pass@host-ci/db?sslmode=require

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Clerk routing (defaults are fine, override if needed)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/app
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/app
```

**Step 2: Verify own `.env.local` is populated** (manual: open `.env.local`, confirm all keys above have values).

**Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: document required env vars"
```

---

### Task 3: Initialize Drizzle config

**Files:**
- Create: `drizzle.config.ts`
- Create: `lib/db/index.ts`

**Step 1: Write `drizzle.config.ts`**

```ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
```

**Step 2: Write the DB client `lib/db/index.ts`**

```ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export type DB = typeof db;
```

**Step 3: Commit (no schema yet — that's Task 4)**

```bash
git add drizzle.config.ts lib/db/index.ts
git commit -m "feat(db): drizzle + neon client setup"
```

---

### Task 4: Define the schema for all six tables

**Files:**
- Create: `lib/db/schema.ts`
- Create: `lib/db/schema.test.ts`

**Before you start:** This task uses Drizzle only (no Zod yet), but when Zod schemas land in later phases, remember the **Zod v4 gotcha** noted in the Pre-flight section: `z.record(V)` requires `z.record(z.string(), V)`, `.format()` → `z.treeifyError`, and `.strict()`/`.passthrough()` semantics shifted. Consult Context7 `/colinhacks/zod` before writing any Zod schema.

**Step 1: Write the failing test first**

```ts
// lib/db/schema.test.ts
import { describe, it, expect } from 'vitest';
import * as schema from './schema';

describe('schema', () => {
  it('exports all six tables from the design', () => {
    expect(schema.leads).toBeDefined();
    expect(schema.engagements).toBeDefined();
    expect(schema.intakeSubmissions).toBeDefined();
    expect(schema.automations).toBeDefined();
    expect(schema.runs).toBeDefined();
    expect(schema.outcomesMonthly).toBeDefined();
  });
});
```

**Step 2: Run, expect FAIL**

Run: `pnpm vitest run lib/db/schema.test.ts`
Expected: FAIL — module `./schema` not found.

**Step 3: Write `lib/db/schema.ts`**

```ts
import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  uuid,
} from 'drizzle-orm/pg-core';

export const engagementStatus = pgEnum('engagement_status', [
  'onboarding',
  'active',
  'paused',
  'churned',
]);

export const automationStatus = pgEnum('automation_status', [
  'draft',
  'live',
  'paused',
  'error',
]);

export const runStatus = pgEnum('run_status', [
  'success',
  'failure',
  'running',
]);

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  industry: text('industry').notNull(),
  situationText: text('situation_text').notNull(),
  demoResultKey: text('demo_result_key'),
  ipHash: text('ip_hash'),
  turnstileVerified: boolean('turnstile_verified').default(false),
  bookedAt: timestamp('booked_at'),
  source: text('source'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const engagements = pgTable('engagements', {
  id: serial('id').primaryKey(),
  leadId: integer('lead_id').references(() => leads.id),
  companyName: text('company_name').notNull(),
  status: engagementStatus('status').default('onboarding').notNull(),
  magicLinkToken: uuid('magic_link_token').defaultRandom().notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  monthlyFeeCents: integer('monthly_fee_cents'),
  clerkUserId: text('clerk_user_id'), // populated when client first logs into /app
});

export const intakeSubmissions = pgTable('intake_submissions', {
  id: serial('id').primaryKey(),
  engagementId: integer('engagement_id')
    .references(() => engagements.id)
    .notNull(),
  toolsJson: jsonb('tools_json').notNull(),
  credentialsVaultRef: text('credentials_vault_ref'),
  goalsText: text('goals_text').notNull(),
  constraintsText: text('constraints_text'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});

export const automations = pgTable('automations', {
  id: serial('id').primaryKey(),
  engagementId: integer('engagement_id')
    .references(() => engagements.id)
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  n8nWorkflowId: text('n8n_workflow_id'),
  status: automationStatus('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const runs = pgTable('runs', {
  id: serial('id').primaryKey(),
  automationId: integer('automation_id')
    .references(() => automations.id)
    .notNull(),
  startedAt: timestamp('started_at').notNull(),
  finishedAt: timestamp('finished_at'),
  status: runStatus('status').notNull(),
  outcomeJson: jsonb('outcome_json'),
  n8nExecutionId: text('n8n_execution_id'),
});

export const outcomesMonthly = pgTable('outcomes_monthly', {
  id: serial('id').primaryKey(),
  engagementId: integer('engagement_id')
    .references(() => engagements.id)
    .notNull(),
  month: text('month').notNull(), // ISO YYYY-MM
  runsCount: integer('runs_count').default(0).notNull(),
  timeSavedMinutes: integer('time_saved_minutes').default(0).notNull(),
  dollarsInfluencedCents: integer('dollars_influenced_cents').default(0).notNull(),
  narrativeMd: text('narrative_md'),
});
```

**Step 4: Run, expect PASS**

Run: `pnpm vitest run lib/db/schema.test.ts`
Expected: PASS.

**Step 5: Add `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
  },
});
```

**Step 6: Commit**

```bash
git add lib/db/schema.ts lib/db/schema.test.ts vitest.config.ts
git commit -m "feat(db): schema for leads/engagements/intake/automations/runs/outcomes"
```

---

### Task 5: Generate and apply the initial migration

**Files:**
- Create: `lib/db/migrations/0000_*.sql` (auto-generated)
- Modify: `package.json` (add scripts)

**Step 1: Add scripts to `package.json`**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio"
}
```

**Step 2: Generate migration**

Run: `pnpm db:generate`
Expected: a new file at `lib/db/migrations/0000_<name>.sql` plus `meta/_journal.json`.

**Step 3: Apply migration to dev DB**

Run: `pnpm db:migrate`
Expected: "migrations applied" output, no errors.

**Step 4: Sanity-check via Drizzle Studio**

Run: `pnpm db:studio`
Open the URL it prints. Confirm all six tables + three enums exist.

**Step 5: Commit**

```bash
git add lib/db/migrations package.json
git commit -m "feat(db): initial migration"
```

---

### Task 6: Wire Clerk into the root layout

**Files:**
- Modify: `app/layout.tsx`

**Before you start:** Per Clerk v7's **current** App Router guide (https://clerk.com/docs/nextjs/getting-started/quickstart):
- `<ClerkProvider>` goes **inside `<body>`**, not wrapping `<html>`. This is a change from older versions — do not revert to the outer-wrap pattern even if training-data snippets show it.
- The deprecated components `<SignedIn>` / `<SignedOut>` have been replaced by `<Show when="signed-in">` / `<Show when="signed-out">`. Use `<Show>` exclusively.

**Step 1: Read existing layout** to understand current providers.

Run: `cat app/layout.tsx`

**Step 2: Wrap with ClerkProvider (inside `<body>`)**

In `app/layout.tsx`, import from `@clerk/nextjs`. Put `<ClerkProvider>` inside the existing `<body>`, so it wraps the app content but not `<html>`. Keep all existing classes, fonts, R3F dynamic imports — preserve them verbatim.

```tsx
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';
// ...existing imports (fonts, globals.css, etc.) preserved...

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body /* preserve existing className / font variables */>
        <ClerkProvider>
          {/* Optional header with auth controls — only add if the existing
              landing page doesn't already have its own nav. If there is
              existing marketing nav, skip adding this header and just
              return {children}. */}
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
```

If adding the auth header block is desired (defer to the implementer's judgment based on the existing landing layout):

```tsx
<header>
  <Show when="signed-out">
    <SignInButton />
    <SignUpButton />
  </Show>
  <Show when="signed-in">
    <UserButton />
  </Show>
</header>
```

**Step 3: Verify the dev server starts**

Run: `pnpm dev`
Expected: server boots on port 3000 with no Clerk-related errors. Visit `/`, see the existing landing page intact (R3F hero, all sections, Framer Motion).

**Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(auth): wrap root layout with ClerkProvider"
```

---

### Task 7: Add proxy for role-based route protection

**Files:**
- Create: `proxy.ts` (project root — **NOT `middleware.ts`**)
- Create: `lib/auth/roles.ts`

**Before you start:** Two **current** conventions per Clerk v7 + Next.js 16 (https://clerk.com/docs/nextjs/getting-started/quickstart):
- The file is **`proxy.ts`**, not `middleware.ts`. Next.js 16 renamed the mechanism; Clerk v7's quickstart uses `proxy.ts` as the canonical name. Older docs still say `middleware.ts` — do not use that name here.
- Use `clerkMiddleware` (NOT the legacy `authMiddleware`), and **always `await auth()`** — in v7 it returns a Promise. v5/v6 snippets from the web or training data will look correct but silently return a truthy Promise object, bypassing auth checks.
- Use the current matcher pattern (file-extension-aware), not the older `.*\\..*` shortcut.

Consult Context7 `/clerk/javascript` if signatures diverge.

**Step 1: Write `lib/auth/roles.ts`** (small role helper)

```ts
import type { User } from '@clerk/nextjs/server';

export type Role = 'admin' | 'client';

export function getRole(user: Pick<User, 'publicMetadata'> | null): Role | null {
  const role = user?.publicMetadata?.role;
  if (role === 'admin' || role === 'client') return role;
  return null;
}
```

**Step 2: Write a unit test for the role helper**

Create `lib/auth/roles.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getRole } from './roles';

describe('getRole', () => {
  it('returns admin when metadata role is admin', () => {
    expect(getRole({ publicMetadata: { role: 'admin' } } as any)).toBe('admin');
  });
  it('returns client when metadata role is client', () => {
    expect(getRole({ publicMetadata: { role: 'client' } } as any)).toBe('client');
  });
  it('returns null for unknown role', () => {
    expect(getRole({ publicMetadata: { role: 'hacker' } } as any)).toBeNull();
  });
  it('returns null for null user', () => {
    expect(getRole(null)).toBeNull();
  });
});
```

Run: `pnpm vitest run lib/auth/roles.test.ts`
Expected: PASS.

**Step 3: Write `proxy.ts`** (project root)

Reference Clerk's current API (read `node_modules/@clerk/nextjs/dist/types/server/index.d.ts` if signature differs). Use the file-extension-aware matcher from Clerk's current quickstart:

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isClientRoute = createRouteMatcher(['/app(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.redirect(new URL('/sign-in', req.url));
    const role = (sessionClaims?.publicMetadata as any)?.role;
    if (role !== 'admin') return new NextResponse('Forbidden', { status: 403 });
  }

  if (isClientRoute(req)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.redirect(new URL('/sign-in', req.url));
    const role = (sessionClaims?.publicMetadata as any)?.role;
    if (role !== 'client' && role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**Step 4: Verify dev still boots**

Run: `pnpm dev`. Visit `/admin` while signed out → expect redirect to `/sign-in`.

**Step 5: Commit**

```bash
git add proxy.ts lib/auth/roles.ts lib/auth/roles.test.ts
git commit -m "feat(auth): role-based proxy for /admin and /app"
```

---

### Task 8: Sign-in / sign-up routes

**Files:**
- Create: `app/sign-in/[[...sign-in]]/page.tsx`
- Create: `app/sign-up/[[...sign-up]]/page.tsx`

**Step 1: Sign-in page**

```tsx
import { SignIn } from '@clerk/nextjs';
export default function Page() {
  return <SignIn />;
}
```

**Step 2: Sign-up page**

```tsx
import { SignUp } from '@clerk/nextjs';
export default function Page() {
  return <SignUp />;
}
```

**Step 3: Manual smoke test**

Run: `pnpm dev`. Visit `/sign-in` and `/sign-up`. Confirm Clerk widget renders.

**Step 4: Commit**

```bash
git add app/sign-in app/sign-up
git commit -m "feat(auth): sign-in and sign-up pages"
```

---

### Task 9: Empty `/app` layout shell

**Files:**
- Create: `app/app/layout.tsx`
- Create: `app/app/page.tsx`

**Step 1: Layout**

```tsx
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <nav className="flex gap-6 text-sm">
          <Link href="/app">Automations</Link>
          <Link href="/app/runs">Runs</Link>
          <Link href="/app/reports">Reports</Link>
        </nav>
        <UserButton afterSignOutUrl="/" />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

**Step 2: Placeholder page**

```tsx
export default function AppHome() {
  return <p className="text-sm text-neutral-500">Client portal — coming in Phase 4.</p>;
}
```

**Step 3: Commit**

```bash
git add app/app
git commit -m "feat(portal): empty /app layout shell"
```

---

### Task 10: Empty `/admin` layout shell

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`

**Step 1: Layout** — same pattern as Task 9, with admin nav (Leads / Clients / Automations / Intake).

**Step 2: Placeholder page** — "Ops console — coming in Phase 3."

**Step 3: Commit**

```bash
git add app/admin
git commit -m "feat(ops): empty /admin layout shell"
```

---

### Task 11: Smoke E2E test for auth gates

**Files:**
- Create: `tests/e2e/auth-gates.spec.ts`
- Modify: `package.json` (add `test:e2e` script)
- Create: `playwright.config.ts`

**Step 1: Install Playwright**

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

**Step 2: Add `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Step 3: Add script to `package.json`**

```json
"test:e2e": "playwright test"
```

**Step 4: Write the test**

```ts
import { test, expect } from '@playwright/test';

test('signed-out user hitting /admin is redirected to /sign-in', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('signed-out user hitting /app is redirected to /sign-in', async ({ page }) => {
  await page.goto('/app');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('landing page is publicly accessible', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/raijuu/i);
});
```

**Step 5: Run**

Run: `pnpm test:e2e`
Expected: 3 passing.

**Step 6: Clean up Playwright artifacts** (per memory rule):

```bash
rm -rf test-results playwright-report
```

**Step 7: Commit**

```bash
git add tests/e2e playwright.config.ts package.json pnpm-lock.yaml
git commit -m "test(e2e): smoke tests for auth gates"
```

---

### Task 12: README update + hand-off

**Files:**
- Modify: `README.md`

**Step 1:** Add a "Local Development" section documenting:
- Required env vars (point to `.env.example`)
- `pnpm install`, `pnpm db:migrate`, `pnpm dev`
- How to grant yourself the `admin` role in Clerk dashboard (publicMetadata: `{"role": "admin"}`)
- How to run unit + E2E tests

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: local dev setup for Phase 0 foundation"
```

---

## Phase 0 Done When

- [ ] `pnpm test` passes (unit)
- [ ] `pnpm test:e2e` passes (smoke)
- [ ] Visiting `/` shows the existing landing page
- [ ] Visiting `/admin` signed-out redirects to `/sign-in`
- [ ] Visiting `/admin` signed-in *without* admin role returns 403
- [ ] Visiting `/admin` signed-in *with* admin role shows the placeholder page
- [ ] Visiting `/app` signed-in as a client shows the placeholder page
- [ ] Drizzle Studio shows all six tables on the Neon dev branch
- [ ] No Playwright artifacts (`test-results/`, `playwright-report/`) left behind

## What Phase 1 Will Pick Up

Phase 1 (Gated Demo) will add: `/demo` route, demo content JSON per industry, server action for lead capture, Resend integration for notifications, Cal.com embed, Turnstile bot check. None of that is in Phase 0.
