# Raijuu Dashboard — Phase 4: Client Portal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship `/app/*` — a tested-skeleton client portal where signed-in clients see their automations, recent runs, and current-month outcome numbers. Lands the n8n→Postgres ingestion webhook + monthly aggregation cron that powers it.

**Architecture:**
- **Engagement claiming.** First time a signed-in client hits `/app/*`, the layout looks up engagements with matching `lead.email` and an empty `clerk_user_id`. If exactly one matches, it atomically writes the user's Clerk id onto the row (`UPDATE … WHERE clerk_user_id IS NULL` as the optimistic guard). Zero or multiple matches route to `/app/no-engagement`. Repeat visits skip the lookup because the engagement is already claimed.
- **n8n ingestion.** A POST endpoint at `/api/n8n/run-callback` accepts `{ n8nExecutionId, automationId, startedAt, finishedAt, status, outcome }`, authenticated by a constant-time-compared `Authorization: Bearer $N8N_WEBHOOK_SECRET`. The insert is idempotent via a new unique index on `runs.n8n_execution_id` — n8n's own retry behavior handles transient failures, no dead-letter table for v1.
- **Monthly aggregation.** A Vercel Cron entry hits `/api/cron/aggregate-monthly` on the 1st of each month at 06:00 UTC, gated by `Authorization: Bearer $CRON_SECRET`. The handler aggregates the prior month's runs (count, sum of `outcome.time_saved_minutes`, sum of `outcome.dollars_influenced_cents`) into `outcomes_monthly` via UPSERT on `(engagement_id, month)`. `narrative_md` is deferred — Phase 4 ships numerics only.
- **Reuse over rebuild.** The portal pages reuse `Table`, `EmptyState`, `StatusPill`, and `formatters` from `app/admin/_components/`. No new visual primitives.

**Tech Stack:** Next.js 16.2.3 (RSC, async `params`), Clerk v7 (`currentUser()` async), Drizzle 0.45 over Neon, Zod 4, Vitest 4, Playwright 1.59. New: `vercel.json` for cron config. No new npm deps.

**Reference design:** `docs/plans/2026-04-13-dashboard-design.md` §4.5 + §5.4 + §6.

**Pre-flight rules** (carried from prior phases):
- Next 16: `params` and `searchParams` are Promises — await them.
- Clerk v7: `auth()` and `currentUser()` are async.
- Zod 4: `safeParse` → `result.error.issues`.
- pnpm only. Never `git add .` — name every path.
- Drizzle migrations: `pnpm db:generate` to author, `pnpm db:migrate` to apply (already wired to `DATABASE_URL`).
- Use `drizzle-orm/neon-http` (no transactions) — every multi-statement op must be idempotent or sequential-safe.

---

## Phase 4 Scope

**In:**
- Drizzle migration adding `UNIQUE INDEX runs_n8n_execution_id_uniq` on `runs.n8n_execution_id` (the migration is mandatory for webhook idempotency).
- `lib/portal/engagement.ts` — `getEngagementForUser(userId, email)` with email-match auto-claim and atomic `clerk_user_id` update.
- `app/app/layout.tsx` — replaces the existing shell. Calls `currentUser()` + claim, redirects unauthenticated to sign-in, redirects no-engagement to `/app/no-engagement`. Persists the resolved `engagementId` to children via React `cache()`-backed helper rather than props (server components can re-call cheaply).
- `app/app/no-engagement/page.tsx` — friendly dead-end.
- `app/app/page.tsx` — automations list (replaces existing placeholder).
- `app/app/runs/page.tsx` — last 30 runs across the engagement's automations.
- `app/app/reports/page.tsx` — current-month outcomes card.
- `lib/portal/{automations,runs,outcomes}.ts` — engagement-scoped query helpers.
- `app/api/n8n/run-callback/route.ts` — Bearer-auth POST, Zod body, idempotent insert.
- `lib/cron/aggregate-monthly.ts` — pure aggregator (so it's testable independently of the route).
- `app/api/cron/aggregate-monthly/route.ts` — Bearer-auth GET (Vercel Cron uses GET) wrapping the aggregator.
- `vercel.json` — cron schedule.
- Tests: unit tests for the engagement claim + aggregator (real Drizzle against Neon, seeded rows, cleanup), webhook auth tests, portal e2e (signed-out redirect + no-engagement redirect when claim returns null).
- README + `.env.example` updates for `N8N_WEBHOOK_SECRET`, `CRON_SECRET`, `vercel.json` note.

**Out (deferred):**
- `narrative_md` editing UI on `outcomes_monthly` — defer to v1.1 (would be an admin form on `/admin/clients/[id]`).
- Multi-engagement clients (clients with two unrelated companies). Phase 4 routes them to `/app/no-engagement` with "multiple engagements found, contact Raijuu". Real fix is a picker — defer.
- Dead-letter table for failed webhook ingestion (design doc §6 mentions it). Phase 4 trusts n8n's retry semantics + the unique index. Add only if observed failures justify.
- Re-running aggregation for an arbitrary historical month from an admin button — defer.
- Real Clerk-test-token e2e for signed-in portal flows. Phase 4 e2e covers the negative paths (signed-out, unclaimed) — manual pre-flight covers the happy path.
- HMAC for the webhook (just a Bearer token; the only attack is fake `runs` rows, which an attacker would need the secret for anyway).

---

### Task 1: Migration — unique index on runs.n8n_execution_id

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `lib/db/migrations/<auto-generated>.sql` (via `pnpm db:generate`)

**Why:** The webhook will be hit multiple times for the same execution (n8n retries on 5xx). Without a unique index, we'd write duplicate rows. With it, the second insert errors on conflict and we treat that as success.

**Step 1: Modify the schema**

In `lib/db/schema.ts`, locate the `runs` table definition (around line 117). The third argument (the index callback) currently has `automationIdIdx` and `startedAtIdx`. Add a third entry:

```ts
n8nExecutionIdUniq: uniqueIndex('runs_n8n_execution_id_uniq').on(t.n8nExecutionId),
```

Result should look like:

```ts
(t) => ({
  automationIdIdx: index('runs_automation_id_idx').on(t.automationId),
  startedAtIdx: index('runs_started_at_idx').on(t.startedAt),
  n8nExecutionIdUniq: uniqueIndex('runs_n8n_execution_id_uniq').on(t.n8nExecutionId),
}),
```

`uniqueIndex` is already imported at the top of the file — no new import needed.

**Step 2: Generate the migration**

```bash
pnpm db:generate
```

Drizzle Kit prints the generated SQL filename (something like `lib/db/migrations/0002_<random>.sql`). Open it and confirm it contains:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "runs_n8n_execution_id_uniq" ON "runs" USING btree ("n8n_execution_id");
```

**Step 3: Apply the migration**

```bash
pnpm db:migrate
```

Expected output: a confirmation that one migration was applied. If your local Neon already has rows in `runs` (it shouldn't — Phase 4 is the first writer), and any have duplicate `n8n_execution_id`, the migration will error. In that case, dedupe first.

**Step 4: Verify**

```bash
pnpm test
pnpm build
```

Both must remain green.

**Step 5: Commit**

```bash
git add lib/db/schema.ts lib/db/migrations
git commit -m "feat(db): unique index on runs.n8n_execution_id for webhook idempotency"
```

---

### Task 2: Engagement claim helper

**Files:**
- Create: `lib/portal/engagement.ts`
- Create: `lib/portal/engagement.test.ts`

**Why:** This is the gate every `/app/*` request passes through. The atomicity matters — if two requests land simultaneously for the same email, exactly one should claim and one should fail. The unit tests use a real Neon DB, seeded per-test, because mocking Drizzle is more brittle than the actual queries.

**Step 1: Implement**

`lib/portal/engagement.ts`:

```ts
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { engagements, leads, type Engagement } from '@/lib/db/schema';

export type ClaimOutcome =
  | { kind: 'claimed'; engagement: Engagement }
  | { kind: 'already-claimed'; engagement: Engagement }
  | { kind: 'no-match' }
  | { kind: 'multiple-matches' };

export async function getEngagementForUser(
  userId: string,
  email: string,
): Promise<ClaimOutcome> {
  // 1. Already claimed by this user?
  const [existing] = await db
    .select()
    .from(engagements)
    .where(eq(engagements.clerkUserId, userId))
    .limit(1);
  if (existing) return { kind: 'already-claimed', engagement: existing };

  // 2. Find unclaimed engagements for this email
  const candidates = await db
    .select({ engagement: engagements })
    .from(engagements)
    .innerJoin(leads, eq(engagements.leadId, leads.id))
    .where(and(eq(leads.email, email), isNull(engagements.clerkUserId)));

  if (candidates.length === 0) return { kind: 'no-match' };
  if (candidates.length > 1) return { kind: 'multiple-matches' };

  // 3. Atomic claim with WHERE clerk_user_id IS NULL guard
  const target = candidates[0].engagement;
  const [claimed] = await db
    .update(engagements)
    .set({ clerkUserId: userId })
    .where(and(eq(engagements.id, target.id), isNull(engagements.clerkUserId)))
    .returning();

  // If another request claimed it between our SELECT and UPDATE, claimed will be undefined
  if (!claimed) return { kind: 'no-match' };
  return { kind: 'claimed', engagement: claimed };
}
```

**Step 2: Write integration tests**

These are integration tests against a real Neon DB. They follow the Phase 2 pattern in `tests/e2e/fixtures/seed-engagement.ts` (using the live `db` import) but live in Vitest because they don't need a browser.

`lib/portal/engagement.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { engagements, leads } from '@/lib/db/schema';
import { getEngagementForUser } from './engagement';

async function seedLead(email: string) {
  const [lead] = await db
    .insert(leads)
    .values({
      email,
      industry: 'test',
      situationText: 'test seed',
    })
    .returning();
  return lead;
}

async function seedEngagement(leadId: number, opts: { clerkUserId?: string } = {}) {
  const [eng] = await db
    .insert(engagements)
    .values({
      leadId,
      companyName: `Test Co ${Date.now()}`,
      clerkUserId: opts.clerkUserId,
    })
    .returning();
  return eng;
}

async function cleanup(emails: string[]) {
  for (const email of emails) {
    const matchingLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.email, email));
    for (const lead of matchingLeads) {
      await db.delete(engagements).where(eq(engagements.leadId, lead.id));
      await db.delete(leads).where(eq(leads.id, lead.id));
    }
  }
}

describe('getEngagementForUser', () => {
  const stamp = Date.now();
  const noMatchEmail = `no-match-${stamp}@raijuu.test`;
  const oneMatchEmail = `one-match-${stamp}@raijuu.test`;
  const claimedEmail = `claimed-${stamp}@raijuu.test`;
  const multiEmail = `multi-${stamp}@raijuu.test`;
  const allEmails = [noMatchEmail, oneMatchEmail, claimedEmail, multiEmail];

  beforeEach(async () => {
    await cleanup(allEmails);
  });

  it('returns no-match when no engagement exists for the email', async () => {
    const result = await getEngagementForUser(`user_${stamp}_a`, noMatchEmail);
    expect(result.kind).toBe('no-match');
  });

  it('claims a single matching unclaimed engagement', async () => {
    const lead = await seedLead(oneMatchEmail);
    await seedEngagement(lead.id);

    const userId = `user_${stamp}_b`;
    const result = await getEngagementForUser(userId, oneMatchEmail);
    expect(result.kind).toBe('claimed');
    if (result.kind === 'claimed') {
      expect(result.engagement.clerkUserId).toBe(userId);
    }

    // Subsequent call returns already-claimed
    const second = await getEngagementForUser(userId, oneMatchEmail);
    expect(second.kind).toBe('already-claimed');
  });

  it('returns already-claimed when the user already owns an engagement', async () => {
    const userId = `user_${stamp}_c`;
    const lead = await seedLead(claimedEmail);
    await seedEngagement(lead.id, { clerkUserId: userId });

    const result = await getEngagementForUser(userId, claimedEmail);
    expect(result.kind).toBe('already-claimed');
  });

  it('returns multiple-matches when more than one unclaimed engagement matches', async () => {
    const lead = await seedLead(multiEmail);
    await seedEngagement(lead.id);
    await seedEngagement(lead.id);

    const result = await getEngagementForUser(`user_${stamp}_d`, multiEmail);
    expect(result.kind).toBe('multiple-matches');
  });
});
```

**Step 3: Run tests**

```bash
pnpm test lib/portal/engagement.test.ts
```

Expected: 4 passed. They actually hit Neon — if this is slow (>5s) or flaky, that's expected for a serverless DB; it's still cheaper than mocking Drizzle.

**Step 4: Commit**

```bash
git add lib/portal/engagement.ts lib/portal/engagement.test.ts
git commit -m "feat(portal): email-match engagement claim with atomic guard"
```

---

### Task 3: Portal layout — auth + claim

**Files:**
- Modify: `app/app/layout.tsx`

**Why:** Today's `/app/layout.tsx` is a marketing-style shell with no role check. We need it to enforce sign-in, run the claim helper, and route no-engagement users out of the portal so the data pages can assume an engagement exists.

**Step 1: Replace the file**

`app/app/layout.tsx`:

```tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { headers } from 'next/headers';
import { getEngagementForUser } from '@/lib/portal/engagement';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app');

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) redirect('/app/no-engagement');

  // Skip claim attempt on the no-engagement route itself (avoid infinite loop)
  const pathname = (await headers()).get('x-pathname') ?? '';
  const isNoEngagementRoute = pathname.startsWith('/app/no-engagement');

  if (!isNoEngagementRoute) {
    const result = await getEngagementForUser(user.id, email);
    if (result.kind === 'no-match' || result.kind === 'multiple-matches') {
      redirect('/app/no-engagement');
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <nav className="flex gap-6 text-sm">
          <Link href="/app">Automations</Link>
          <Link href="/app/runs">Runs</Link>
          <Link href="/app/reports">Reports</Link>
        </nav>
        <UserButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

**Note on `x-pathname`:** Next.js 16 doesn't expose the current pathname inside server-component layouts. The accepted workaround is a tiny middleware that copies the pathname into a request header, OR — since we don't have a middleware in this project — we accept that the no-engagement page's `children` will be rendered after the claim attempt has already determined "no match" and redirected. Re-running the claim from inside `/app/no-engagement` is harmless (it returns `no-match` and redirects to itself, which Next dedupes).

**Simpler implementation: drop the pathname check.** If a user without an engagement hits `/app/no-engagement` directly, the layout calls `getEngagementForUser` → `no-match` → `redirect('/app/no-engagement')` — but that redirect is a no-op (already on the target route, Next short-circuits). Clean. Use this:

```tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { getEngagementForUser } from '@/lib/portal/engagement';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app');

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) redirect('/app/no-engagement');

  const result = await getEngagementForUser(user.id, email);
  if (result.kind === 'no-match' || result.kind === 'multiple-matches') {
    // The /app/no-engagement page handles this redirect target; Next dedupes
    // re-redirecting to the current URL.
    redirect('/app/no-engagement');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <nav className="flex gap-6 text-sm">
          <Link href="/app">Automations</Link>
          <Link href="/app/runs">Runs</Link>
          <Link href="/app/reports">Reports</Link>
        </nav>
        <UserButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

**However** — testing reveals that `redirect()` to the current URL throws `NEXT_REDIRECT` and Next does NOT dedupe; it loops. **Correct fix:** make `/app/no-engagement` use a separate route group that doesn't share the layout. Move it to `app/(no-engagement)/no-engagement/page.tsx` with its own minimal layout. Then update the redirect to `/no-engagement` (no `/app` prefix).

**Final implementation — use a separate route group:**

```tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { getEngagementForUser } from '@/lib/portal/engagement';

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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <nav className="flex gap-6 text-sm">
          <Link href="/app">Automations</Link>
          <Link href="/app/runs">Runs</Link>
          <Link href="/app/reports">Reports</Link>
        </nav>
        <UserButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

The `/no-engagement` route is created in Task 4.

**Step 2: Verify**

```bash
pnpm test
pnpm build
```

Both must remain green.

**Step 3: Commit**

```bash
git add app/app/layout.tsx
git commit -m "feat(portal): require sign-in + claim engagement on /app entry"
```

---

### Task 4: /no-engagement page

**Files:**
- Create: `app/no-engagement/page.tsx`
- Create: `app/no-engagement/layout.tsx`

**Why:** A separate route (outside `/app/*`) so the portal layout's redirect doesn't loop. Layout deliberately minimal — just header, no nav.

**Step 1: Implement layout**

`app/no-engagement/layout.tsx`:

```tsx
import { UserButton } from '@clerk/nextjs';

export default function NoEngagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-end">
        <UserButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

**Step 2: Implement page**

`app/no-engagement/page.tsx`:

```tsx
export default function NoEngagementPage() {
  return (
    <div className="max-w-md mx-auto mt-12 text-center space-y-4">
      <h1 className="text-lg font-semibold">We can't find your engagement</h1>
      <p className="text-sm text-neutral-600">
        Either we don't have a record of your email yet, or there are multiple
        engagements that need to be sorted out manually. Either way, please
        reach out to Raijuu and we'll fix it.
      </p>
      <p className="text-sm">
        <a className="underline" href="mailto:hello@raijuu.ai">
          hello@raijuu.ai
        </a>
      </p>
    </div>
  );
}
```

(Adjust the email address to whatever Raijuu's actual support address is — `RESEND_ADMIN_EMAIL` is `ramonvallejerajr@gmail.com` per memory; use that or a real `hello@` if one exists.)

**Step 3: Verify**

`pnpm build` — `/no-engagement` should appear in the route table.

**Step 4: Commit**

```bash
git add app/no-engagement
git commit -m "feat(portal): /no-engagement dead-end page"
```

---

### Task 5: Portal data helpers

**Files:**
- Create: `lib/portal/data.ts`

**Why:** Each `/app/*` page needs the engagement scoped to the current user. Centralize here so pages stay thin.

**Step 1: Implement**

`lib/portal/data.ts`:

```ts
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  engagements,
  automations,
  runs,
  outcomesMonthly,
} from '@/lib/db/schema';

export async function getEngagementByClerkUserId(userId: string) {
  const [row] = await db
    .select()
    .from(engagements)
    .where(eq(engagements.clerkUserId, userId))
    .limit(1);
  return row ?? null;
}

export async function listAutomationsForEngagement(engagementId: number) {
  return db
    .select()
    .from(automations)
    .where(eq(automations.engagementId, engagementId))
    .orderBy(desc(automations.createdAt))
    .limit(50);
}

export async function listRecentRunsForEngagement(engagementId: number) {
  return db
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
    .limit(30);
}

export async function getCurrentMonthOutcome(engagementId: number) {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const [row] = await db
    .select()
    .from(outcomesMonthly)
    .where(
      and(
        eq(outcomesMonthly.engagementId, engagementId),
        eq(outcomesMonthly.month, month),
      ),
    )
    .limit(1);
  return { month, outcome: row ?? null };
}
```

No unit tests — these are thin Drizzle wrappers. The portal e2e covers the page-level integration.

**Step 2: Commit**

```bash
git add lib/portal/data.ts
git commit -m "feat(portal): engagement-scoped data helpers"
```

---

### Task 6: /app — automations list

**Files:**
- Modify: `app/app/page.tsx`

**Why:** Replaces the existing placeholder. The layout has already verified an engagement exists by this point.

**Step 1: Replace**

`app/app/page.tsx`:

```tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { formatDate } from '@/app/admin/_components/formatters';
import {
  getEngagementByClerkUserId,
  listAutomationsForEngagement,
} from '@/lib/portal/data';
import type { Automation } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function PortalHome() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const rows = await listAutomationsForEngagement(engagement.id);

  const columns: Column<Automation>[] = [
    { header: 'Name', cell: (r) => r.name },
    {
      header: 'What it does',
      cell: (r) => r.description ?? '—',
      className: 'max-w-md',
    },
    { header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
    { header: 'Live since', cell: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{engagement.companyName}</h1>
      <p className="text-sm text-neutral-600">Your automations</p>
      <Table
        columns={columns}
        rows={rows}
        emptyFallback={
          <EmptyState
            title="No automations yet"
            description="Raijuu is building your first automations. You'll see them here as soon as they're live."
          />
        }
      />
    </div>
  );
}
```

**Step 2: Verify**

`pnpm build` — the page imports must resolve. No new tests.

**Step 3: Commit**

```bash
git add app/app/page.tsx
git commit -m "feat(portal): /app shows engagement automations"
```

---

### Task 7: /app/runs — recent runs

**Files:**
- Create: `app/app/runs/page.tsx`

**Step 1: Implement**

`app/app/runs/page.tsx`:

```tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import { formatRelative } from '@/app/admin/_components/formatters';
import {
  getEngagementByClerkUserId,
  listRecentRunsForEngagement,
} from '@/lib/portal/data';

export const dynamic = 'force-dynamic';

type Row = Awaited<ReturnType<typeof listRecentRunsForEngagement>>[number];

function summarizeOutcome(outcomeJson: unknown): string {
  if (!outcomeJson || typeof outcomeJson !== 'object') return '—';
  const o = outcomeJson as { summary?: unknown };
  if (typeof o.summary === 'string' && o.summary.length > 0) {
    return o.summary.length > 80 ? `${o.summary.slice(0, 80)}…` : o.summary;
  }
  return '—';
}

export default async function RunsPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app/runs');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const rows = await listRecentRunsForEngagement(engagement.id);

  const columns: Column<Row>[] = [
    { header: 'Automation', cell: (r) => r.automationName },
    { header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
    { header: 'Outcome', cell: (r) => summarizeOutcome(r.outcomeJson) },
    { header: 'Started', cell: (r) => formatRelative(r.startedAt) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Recent runs</h1>
      <Table
        columns={columns}
        rows={rows}
        emptyFallback={
          <EmptyState
            title="No runs yet"
            description="Run history appears as your automations execute."
          />
        }
      />
    </div>
  );
}
```

**Step 2: Verify**

`pnpm build` — must compile.

**Step 3: Commit**

```bash
git add app/app/runs
git commit -m "feat(portal): /app/runs lists last 30 runs across automations"
```

---

### Task 8: /app/reports — current month outcomes card

**Files:**
- Create: `app/app/reports/page.tsx`

**Step 1: Implement**

`app/app/reports/page.tsx`:

```tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  formatMoneyCents,
} from '@/app/admin/_components/formatters';
import {
  getEngagementByClerkUserId,
  getCurrentMonthOutcome,
} from '@/lib/portal/data';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/app/reports');
  const engagement = await getEngagementByClerkUserId(user.id);
  if (!engagement) redirect('/no-engagement');

  const { month, outcome } = await getCurrentMonthOutcome(engagement.id);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold">Reports</h1>
        <p className="text-sm text-neutral-600">{month}</p>
      </div>

      {outcome ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Runs this month" value={String(outcome.runsCount)} />
          <Stat
            label="Time saved"
            value={`${outcome.timeSavedMinutes} min`}
          />
          <Stat
            label="Dollars influenced"
            value={formatMoneyCents(outcome.dollarsInfluencedCents)}
          />
        </div>
      ) : (
        <p className="text-sm text-neutral-600">
          This month's report computes on the 1st of next month. Check back
          then — or ping Raijuu if you want a snapshot sooner.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-xs text-neutral-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
```

**Step 2: Verify**

`pnpm build`.

**Step 3: Commit**

```bash
git add app/app/reports
git commit -m "feat(portal): /app/reports shows current month outcome stats"
```

---

### Task 9: n8n webhook — /api/n8n/run-callback

**Files:**
- Create: `app/api/n8n/run-callback/route.ts`
- Create: `app/api/n8n/run-callback/route.test.ts`
- Create: `lib/n8n/auth.ts`
- Create: `lib/n8n/auth.test.ts`

**Why:** This is the entry point for execution data. It must be authenticated, idempotent, and reject malformed payloads cleanly so n8n's retries don't loop forever.

**Step 1: Auth helper**

`lib/n8n/auth.ts`:

```ts
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function verifyN8nBearer(authHeader: string | null): boolean {
  const expected = process.env.N8N_WEBHOOK_SECRET;
  if (!expected) return false;
  if (!authHeader) return false;
  const match = /^Bearer\s+(.+)$/.exec(authHeader);
  if (!match) return false;
  return timingSafeEqual(match[1].trim(), expected);
}
```

`lib/n8n/auth.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifyN8nBearer } from './auth';

const ORIGINAL = process.env.N8N_WEBHOOK_SECRET;

describe('verifyN8nBearer', () => {
  beforeEach(() => {
    process.env.N8N_WEBHOOK_SECRET = 'super-secret-value';
  });
  afterEach(() => {
    if (ORIGINAL == null) delete process.env.N8N_WEBHOOK_SECRET;
    else process.env.N8N_WEBHOOK_SECRET = ORIGINAL;
  });

  it('accepts a matching Bearer header', () => {
    expect(verifyN8nBearer('Bearer super-secret-value')).toBe(true);
  });
  it('rejects a wrong secret', () => {
    expect(verifyN8nBearer('Bearer wrong')).toBe(false);
  });
  it('rejects missing header', () => {
    expect(verifyN8nBearer(null)).toBe(false);
  });
  it('rejects malformed header', () => {
    expect(verifyN8nBearer('super-secret-value')).toBe(false);
  });
  it('rejects when env not set', () => {
    delete process.env.N8N_WEBHOOK_SECRET;
    expect(verifyN8nBearer('Bearer anything')).toBe(false);
  });
});
```

**Step 2: Route**

`app/api/n8n/run-callback/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { runs, automations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyN8nBearer } from '@/lib/n8n/auth';

const bodySchema = z.object({
  n8nExecutionId: z.string().min(1).max(120),
  automationId: z.number().int().positive(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  status: z.enum(['success', 'failure', 'running']),
  outcome: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  if (!verifyN8nBearer(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const [automation] = await db
    .select({ id: automations.id })
    .from(automations)
    .where(eq(automations.id, data.automationId))
    .limit(1);
  if (!automation) {
    return NextResponse.json({ error: 'automation-not-found' }, { status: 404 });
  }

  try {
    const [inserted] = await db
      .insert(runs)
      .values({
        automationId: data.automationId,
        startedAt: new Date(data.startedAt),
        finishedAt: data.finishedAt ? new Date(data.finishedAt) : null,
        status: data.status,
        outcomeJson: data.outcome ?? null,
        n8nExecutionId: data.n8nExecutionId,
      })
      .returning({ id: runs.id });
    return NextResponse.json({ runId: inserted.id, idempotent: false });
  } catch (err) {
    // Idempotency: unique-violation on n8n_execution_id means this run already exists
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('runs_n8n_execution_id_uniq')) {
      const [existing] = await db
        .select({ id: runs.id })
        .from(runs)
        .where(eq(runs.n8nExecutionId, data.n8nExecutionId))
        .limit(1);
      return NextResponse.json({ runId: existing?.id ?? null, idempotent: true });
    }
    console.error('[n8n-callback] unexpected error', err);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
```

**Step 3: Route tests**

`app/api/n8n/run-callback/route.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { engagements, leads, automations, runs } from '@/lib/db/schema';
import { POST } from './route';

const SECRET = 'webhook-test-secret';
const ORIGINAL = process.env.N8N_WEBHOOK_SECRET;

async function seed() {
  const [lead] = await db.insert(leads).values({
    email: `n8n-${Date.now()}@raijuu.test`,
    industry: 'test',
    situationText: 'seed',
  }).returning();
  const [eng] = await db.insert(engagements).values({
    leadId: lead.id,
    companyName: 'Webhook Test Co',
  }).returning();
  const [auto] = await db.insert(automations).values({
    engagementId: eng.id,
    name: 'Webhook Test Automation',
  }).returning();
  return { leadId: lead.id, engagementId: eng.id, automationId: auto.id };
}

async function cleanup(ids: { leadId: number; engagementId: number; automationId: number }) {
  await db.delete(runs).where(eq(runs.automationId, ids.automationId));
  await db.delete(automations).where(eq(automations.id, ids.automationId));
  await db.delete(engagements).where(eq(engagements.id, ids.engagementId));
  await db.delete(leads).where(eq(leads.id, ids.leadId));
}

function makeRequest(body: unknown, opts: { auth?: string } = {}) {
  return new Request('http://localhost/api/n8n/run-callback', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(opts.auth ? { authorization: opts.auth } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/n8n/run-callback', () => {
  beforeEach(() => {
    process.env.N8N_WEBHOOK_SECRET = SECRET;
  });
  afterEach(() => {
    if (ORIGINAL == null) delete process.env.N8N_WEBHOOK_SECRET;
    else process.env.N8N_WEBHOOK_SECRET = ORIGINAL;
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it('rejects bad bearer with 401', async () => {
    const res = await POST(makeRequest({}, { auth: 'Bearer wrong' }));
    expect(res.status).toBe(401);
  });

  it('rejects malformed body with 400', async () => {
    const res = await POST(
      makeRequest({ status: 'unknown' }, { auth: `Bearer ${SECRET}` }),
    );
    expect(res.status).toBe(400);
  });

  it('inserts a new run and returns idempotent=false', async () => {
    const ids = await seed();
    try {
      const exec = `exec-${Date.now()}`;
      const res = await POST(
        makeRequest(
          {
            n8nExecutionId: exec,
            automationId: ids.automationId,
            startedAt: new Date().toISOString(),
            status: 'success',
            outcome: { time_saved_minutes: 12 },
          },
          { auth: `Bearer ${SECRET}` },
        ),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.idempotent).toBe(false);
      expect(typeof body.runId).toBe('number');
    } finally {
      await cleanup(ids);
    }
  });

  it('returns idempotent=true on duplicate execution id', async () => {
    const ids = await seed();
    try {
      const exec = `exec-dup-${Date.now()}`;
      const payload = {
        n8nExecutionId: exec,
        automationId: ids.automationId,
        startedAt: new Date().toISOString(),
        status: 'success' as const,
      };
      const first = await POST(makeRequest(payload, { auth: `Bearer ${SECRET}` }));
      expect(first.status).toBe(200);
      const second = await POST(makeRequest(payload, { auth: `Bearer ${SECRET}` }));
      expect(second.status).toBe(200);
      const body = await second.json();
      expect(body.idempotent).toBe(true);
    } finally {
      await cleanup(ids);
    }
  });

  it('returns 404 when automation does not exist', async () => {
    const res = await POST(
      makeRequest(
        {
          n8nExecutionId: `missing-${Date.now()}`,
          automationId: 999_999_999,
          startedAt: new Date().toISOString(),
          status: 'success',
        },
        { auth: `Bearer ${SECRET}` },
      ),
    );
    expect(res.status).toBe(404);
  });
});
```

**Step 4: Verify**

```bash
pnpm test app/api/n8n lib/n8n
```

Expected: ~10 passes (5 auth + ~6 route).

**Step 5: Commit**

```bash
git add app/api/n8n lib/n8n
git commit -m "feat(n8n): authenticated idempotent run-callback webhook"
```

---

### Task 10: Monthly aggregation

**Files:**
- Create: `lib/cron/aggregate-monthly.ts`
- Create: `lib/cron/aggregate-monthly.test.ts`

**Why:** Pure aggregation, no HTTP — testable on its own. Task 11 wraps it in the route.

**Step 1: Implement**

`lib/cron/aggregate-monthly.ts`:

```ts
import { sql, and, eq, gte, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { runs, automations, outcomesMonthly } from '@/lib/db/schema';

export type MonthSpec = { year: number; monthIndex: number };

export function previousMonth(now: Date = new Date()): MonthSpec {
  const year = now.getUTCFullYear();
  const monthIndex = now.getUTCMonth();
  if (monthIndex === 0) return { year: year - 1, monthIndex: 11 };
  return { year, monthIndex: monthIndex - 1 };
}

export function monthLabel(spec: MonthSpec): string {
  return `${spec.year}-${String(spec.monthIndex + 1).padStart(2, '0')}`;
}

export type AggregateSummary = {
  month: string;
  upserts: number;
};

export async function aggregateMonth(spec: MonthSpec): Promise<AggregateSummary> {
  const monthStart = new Date(Date.UTC(spec.year, spec.monthIndex, 1));
  const monthEnd = new Date(Date.UTC(spec.year, spec.monthIndex + 1, 1));
  const month = monthLabel(spec);

  const grouped = await db
    .select({
      engagementId: automations.engagementId,
      runsCount: sql<number>`count(${runs.id})::int`,
      timeSavedMinutes: sql<number>`coalesce(sum((${runs.outcomeJson}->>'time_saved_minutes')::int), 0)::int`,
      dollarsInfluencedCents: sql<number>`coalesce(sum((${runs.outcomeJson}->>'dollars_influenced_cents')::int), 0)::int`,
    })
    .from(runs)
    .innerJoin(automations, eq(automations.id, runs.automationId))
    .where(and(gte(runs.startedAt, monthStart), lt(runs.startedAt, monthEnd)))
    .groupBy(automations.engagementId);

  let upserts = 0;
  for (const row of grouped) {
    await db
      .insert(outcomesMonthly)
      .values({
        engagementId: row.engagementId,
        month,
        runsCount: row.runsCount,
        timeSavedMinutes: row.timeSavedMinutes,
        dollarsInfluencedCents: row.dollarsInfluencedCents,
      })
      .onConflictDoUpdate({
        target: [outcomesMonthly.engagementId, outcomesMonthly.month],
        set: {
          runsCount: row.runsCount,
          timeSavedMinutes: row.timeSavedMinutes,
          dollarsInfluencedCents: row.dollarsInfluencedCents,
        },
      });
    upserts++;
  }

  return { month, upserts };
}
```

**Step 2: Tests**

`lib/cron/aggregate-monthly.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { engagements, leads, automations, runs, outcomesMonthly } from '@/lib/db/schema';
import { aggregateMonth, previousMonth, monthLabel } from './aggregate-monthly';

describe('previousMonth', () => {
  it('returns prior month within same year', () => {
    const spec = previousMonth(new Date(Date.UTC(2026, 5, 15))); // June
    expect(spec).toEqual({ year: 2026, monthIndex: 4 });
  });
  it('wraps to december of prior year in january', () => {
    const spec = previousMonth(new Date(Date.UTC(2026, 0, 15)));
    expect(spec).toEqual({ year: 2025, monthIndex: 11 });
  });
});

describe('monthLabel', () => {
  it('zero-pads single-digit months', () => {
    expect(monthLabel({ year: 2026, monthIndex: 0 })).toBe('2026-01');
    expect(monthLabel({ year: 2026, monthIndex: 11 })).toBe('2026-12');
  });
});

describe('aggregateMonth', () => {
  it('aggregates a month of runs into outcomes_monthly', async () => {
    const stamp = Date.now();
    const [lead] = await db.insert(leads).values({
      email: `agg-${stamp}@raijuu.test`,
      industry: 'test',
      situationText: 'seed',
    }).returning();
    const [eng] = await db.insert(engagements).values({
      leadId: lead.id,
      companyName: `Agg Test ${stamp}`,
    }).returning();
    const [auto] = await db.insert(automations).values({
      engagementId: eng.id,
      name: 'Agg Test Automation',
    }).returning();

    // Pick a month well in the past so we don't collide with cron runs
    const spec = { year: 2024, monthIndex: 5 }; // June 2024
    const inMonth = new Date(Date.UTC(2024, 5, 10));
    const outOfMonth = new Date(Date.UTC(2024, 6, 1));

    await db.insert(runs).values([
      {
        automationId: auto.id,
        startedAt: inMonth,
        status: 'success',
        outcomeJson: { time_saved_minutes: 30, dollars_influenced_cents: 5000 },
        n8nExecutionId: `exec-agg-${stamp}-1`,
      },
      {
        automationId: auto.id,
        startedAt: inMonth,
        status: 'success',
        outcomeJson: { time_saved_minutes: 15, dollars_influenced_cents: 2500 },
        n8nExecutionId: `exec-agg-${stamp}-2`,
      },
      {
        automationId: auto.id,
        startedAt: outOfMonth,
        status: 'success',
        outcomeJson: { time_saved_minutes: 999 },
        n8nExecutionId: `exec-agg-${stamp}-3`,
      },
    ]);

    const summary = await aggregateMonth(spec);
    expect(summary.month).toBe('2024-06');
    expect(summary.upserts).toBe(1);

    const [outcome] = await db
      .select()
      .from(outcomesMonthly)
      .where(and(
        eq(outcomesMonthly.engagementId, eng.id),
        eq(outcomesMonthly.month, '2024-06'),
      ))
      .limit(1);

    expect(outcome.runsCount).toBe(2);
    expect(outcome.timeSavedMinutes).toBe(45);
    expect(outcome.dollarsInfluencedCents).toBe(7500);

    // Idempotent re-run produces the same result
    const summary2 = await aggregateMonth(spec);
    expect(summary2.upserts).toBe(1);
    const [outcome2] = await db
      .select()
      .from(outcomesMonthly)
      .where(and(
        eq(outcomesMonthly.engagementId, eng.id),
        eq(outcomesMonthly.month, '2024-06'),
      ))
      .limit(1);
    expect(outcome2.runsCount).toBe(2);

    // Cleanup
    await db.delete(outcomesMonthly).where(eq(outcomesMonthly.engagementId, eng.id));
    await db.delete(runs).where(eq(runs.automationId, auto.id));
    await db.delete(automations).where(eq(automations.id, auto.id));
    await db.delete(engagements).where(eq(engagements.id, eng.id));
    await db.delete(leads).where(eq(leads.id, lead.id));
  });
});
```

**Step 3: Verify**

```bash
pnpm test lib/cron
```

Expected: 4 passes (previousMonth: 2, monthLabel: 1, aggregateMonth: 1).

**Step 4: Commit**

```bash
git add lib/cron
git commit -m "feat(cron): aggregate monthly runs into outcomes_monthly"
```

---

### Task 11: Cron route + vercel.json

**Files:**
- Create: `app/api/cron/aggregate-monthly/route.ts`
- Create: `vercel.json`

**Why:** Vercel Cron pings the route; the route checks the auto-injected `Authorization: Bearer $CRON_SECRET` header and runs the aggregator. Locally you can hit it with curl + the same secret.

**Step 1: Route**

`app/api/cron/aggregate-monthly/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { aggregateMonth, previousMonth } from '@/lib/cron/aggregate-monthly';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function verifyCronBearer(authHeader: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  if (!authHeader) return false;
  const m = /^Bearer\s+(.+)$/.exec(authHeader);
  if (!m) return false;
  return timingSafeEqual(m[1].trim(), expected);
}

export async function GET(req: Request) {
  if (!verifyCronBearer(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const summary = await aggregateMonth(previousMonth());
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error('[cron] aggregate-monthly failed', err);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
```

**Step 2: vercel.json**

`vercel.json` (repo root):

```json
{
  "crons": [
    {
      "path": "/api/cron/aggregate-monthly",
      "schedule": "0 6 1 * *"
    }
  ]
}
```

That's "06:00 UTC on the 1st of every month."

**Step 3: Verify**

`pnpm build`. The cron route should appear in the route listing.

**Step 4: Commit**

```bash
git add app/api/cron vercel.json
git commit -m "feat(cron): vercel cron entry hitting authed aggregate route"
```

---

### Task 12: E2E — portal redirects + webhook auth smoke

**Files:**
- Create: `tests/e2e/portal.spec.ts`

**Why:** Cover the negative paths we can test without a real Clerk session: signed-out users get bounced from `/app/*`, and `/no-engagement` is publicly reachable but tells you to sign in (since the layout is bare). Also a quick HTTP smoke against the webhook to confirm 401 without a Bearer.

**Step 1: Implement**

`tests/e2e/portal.spec.ts`:

```ts
import { test, expect, request } from '@playwright/test';

test('signed-out user hitting /app/runs is redirected to /sign-in', async ({ page }) => {
  await page.goto('/app/runs');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('signed-out user hitting /app/reports is redirected to /sign-in', async ({ page }) => {
  await page.goto('/app/reports');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('/no-engagement renders the dead-end message (no auth required for the page itself)', async ({ page }) => {
  await page.goto('/no-engagement');
  await expect(page.getByText("We can't find your engagement")).toBeVisible();
});

test('webhook rejects unauthenticated requests', async () => {
  const ctx = await request.newContext();
  const res = await ctx.post('http://localhost:3000/api/n8n/run-callback', {
    data: { n8nExecutionId: 'e2e', automationId: 1, startedAt: new Date().toISOString(), status: 'success' },
  });
  expect(res.status()).toBe(401);
});
```

**Step 2: Run e2e**

```bash
pnpm test:e2e tests/e2e/portal.spec.ts
```

Expected: 4 passes.

**Step 3: Commit**

```bash
git add tests/e2e/portal.spec.ts
git commit -m "test(e2e): portal sign-in redirects + webhook auth smoke"
```

---

### Task 13: README + .env.example updates

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

**Step 1: .env.example additions**

Append (or insert in the relevant section):

```
# Phase 4 — n8n + cron
N8N_WEBHOOK_SECRET=
CRON_SECRET=
```

`N8N_WEBHOOK_SECRET` is shared with the n8n instance — paste the same value in n8n's HTTP Request node `Authorization` header. `CRON_SECRET` is read by Vercel's built-in cron — set it in the Vercel project Environment Variables and it'll be auto-injected into cron requests.

**Step 2: README — append after the Phase 1 demo env section**

```markdown
### Phase 4 portal + n8n env vars

- **`N8N_WEBHOOK_SECRET`** — Shared secret for the `/api/n8n/run-callback` webhook. Set it here and in your n8n HTTP Request node's `Authorization: Bearer <value>` header. If unset, the webhook rejects all requests.
- **`CRON_SECRET`** — Authorizes the monthly aggregation cron at `/api/cron/aggregate-monthly`. In production, Vercel auto-injects this when the cron defined in `vercel.json` fires. Locally, set it manually and call:
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/aggregate-monthly
  ```
  to recompute last month on demand.
- **Engagement claiming.** First sign-in to `/app` claims an engagement matching the user's email automatically. If no match (or multiple unclaimed matches), the portal redirects to `/no-engagement`. Fix by setting `engagements.clerk_user_id` manually via `pnpm db:studio` or by ensuring the client signs up with the email recorded in `leads.email`.
```

Also add `vercel.json` to the project layout listing under "Project Layout".

**Step 3: Commit**

```bash
git add README.md .env.example
git commit -m "docs(portal): document N8N_WEBHOOK_SECRET, CRON_SECRET, engagement claim"
```

---

### Task 14: Phase 4 verification

**Steps:**

1. `pnpm test` — all green (~75+ tests: ~58 baseline + 4 engagement + 5 n8n auth + ~6 webhook + 4 cron = ~77).
2. `pnpm test:e2e` — all green (10 prior + 4 portal = 14).
3. `pnpm build` — green; new routes:
   - `/app` (now real)
   - `/app/runs`
   - `/app/reports`
   - `/no-engagement`
   - `/api/n8n/run-callback`
   - `/api/cron/aggregate-monthly`
4. Manual pre-flight on localhost:
   - [ ] `pnpm db:migrate` actually applied the unique index (check via Drizzle Studio)
   - [ ] Set `N8N_WEBHOOK_SECRET` in `.env.local`. POST a test row via curl:
     ```bash
     curl -X POST http://localhost:3000/api/n8n/run-callback \
       -H "Authorization: Bearer $N8N_WEBHOOK_SECRET" \
       -H "content-type: application/json" \
       -d '{"n8nExecutionId":"manual-test-1","automationId":<seeded-id>,"startedAt":"2026-04-14T12:00:00Z","status":"success","outcome":{"time_saved_minutes":15,"summary":"manual test"}}'
     ```
     Repeat the same call → second response should have `idempotent: true`.
   - [ ] Set `CRON_SECRET` in `.env.local`. Curl the cron route → see an aggregate response (likely 0 upserts unless you seeded last-month data).
   - [ ] Sign up as a fresh client whose email matches a seeded `leads.email` row tied to an engagement. Visit `/app` — auto-claim, then automations table renders.
   - [ ] Sign up as a client whose email matches nothing — `/app` redirects to `/no-engagement`.
   - [ ] Visit `/admin/clients/[id]` for the claimed engagement — confirm `clerk_user_id` is now populated (via Drizzle Studio).
5. Push & merge.

---

## Phase 4 Done When

- [ ] `pnpm test` green
- [ ] `pnpm test:e2e` green
- [ ] `pnpm build` green and lists all new routes
- [ ] Manual pre-flight checklist passes
- [ ] `vercel.json` lives at repo root
- [ ] `.env.example` documents both new secrets

## What Phase 5 Will Pick Up

Phase 5 — End-to-end rehearsal — drives the full funnel against test data, fixes whatever feels wrong, and writes the production launch checklist. Specifically: hand-edit some `outcomes_monthly.narrative_md` rows to validate that we want a real editor for them, decide whether to add a dead-letter table after observing webhook reliability, and validate the engagement-claim flow with a real client signup.
