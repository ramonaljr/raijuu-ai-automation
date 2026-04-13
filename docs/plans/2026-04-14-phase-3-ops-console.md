# Raijuu Dashboard — Phase 3: Ops Console Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship `/admin/*` — four read-first table views (leads, clients, automations, intake) plus one action (convert lead → engagement + send magic link) so Raijuu can see every row of pipeline/operational state and hand off new clients into the Phase 2 intake flow.

**Architecture:** Server components read directly from Drizzle; no caching layer. A single server-side role gate in `app/admin/layout.tsx` rejects non-admin users (redirect → `/sign-in?need=admin`). One client island per page — the "Convert lead" modal on `/admin/leads`. Tables share three primitives (`Table`, `EmptyState`, `StatusPill`). Automations table renders an empty state until Phase 4's n8n webhook populates rows. No pagination (scope <200 rows per table). No charts, no styling polish — design doc §5.3: "functional, not beautiful."

**Tech Stack:** Next.js 16.2.3 (async `params`/`searchParams`, RSC), Clerk v7 (`auth()` + `currentUser()` are async), Drizzle 0.45, Zod 4, Tailwind 4, Vitest 4, Playwright 1.59. No new deps.

**Reference design:** `docs/plans/2026-04-13-dashboard-design.md` §5.3.

**Pre-flight rules** (carried from Phase 0/1/2):
- Next 16 App Router: `params` and `searchParams` are Promises — await them.
- Clerk v7: `auth()` and `currentUser()` are async.
- Zod 4: `safeParse` → `result.error.issues` (not `errors`).
- pnpm only. Never `git add .` — name every path.
- Read `node_modules/next/dist/docs/` before touching any App Router API whose shape you're not 100% sure about.

---

## Phase 3 Scope

**In:**
- Admin-role gate in `app/admin/layout.tsx` (server component)
- Shared primitives: `app/admin/_components/Table.tsx`, `EmptyState.tsx`, `StatusPill.tsx`
- `/admin` dashboard index — 4 count tiles + nav shortcuts
- `/admin/leads` — table + "Convert to client" modal that POSTs to existing `/api/admin/engagements/create-from-lead`
- `/admin/clients` — engagements list + `/admin/clients/[id]` detail page
- `/admin/automations` — list with empty state (Phase 4 populates)
- `/admin/intake` — submissions list + `/admin/intake/[id]` detail page
- Unit tests for any new pure functions (status-pill variant, count aggregation helper, formatters)
- E2E: extend `auth-gates.spec.ts` with a signed-out check for each new route (role-check for signed-in-non-admin is a manual pre-flight — Clerk test tokens are out of scope for this phase)
- `.env.example` + README updates for admin role grant procedure

**Out (deferred):**
- "Nudge" button / Resend nudge template on leads (design §5.3) — no data model for `nudge_sent_at`, defer to v1.1
- Pagination (use `limit 200`, we're <20 clients)
- Bulk actions / multi-select
- Filtering beyond a single status dropdown where obvious
- Charts, graphs, health heuristics beyond a simple status pill
- Role-enforcement E2E using Clerk test tokens (manual pre-flight only)
- Any write beyond "convert lead to engagement" — admin does not edit leads/automations/submissions in Phase 3

---

### Task 1: Admin role gate in layout

**Files:**
- Modify: `app/admin/layout.tsx`
- Modify: `tests/e2e/auth-gates.spec.ts`

**Why:** The existing admin layout has zero role enforcement. A signed-in *client* would see every lead and engagement. `lib/auth/roles.ts` (`getRole`) was built in Phase 0 for this exact job but has no caller.

**Step 1: Write/extend failing e2e**

Add to `tests/e2e/auth-gates.spec.ts`:

```ts
test('signed-out user hitting /admin/leads is redirected to /sign-in', async ({ page }) => {
  await page.goto('/admin/leads');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('signed-out user hitting /admin/clients is redirected to /sign-in', async ({ page }) => {
  await page.goto('/admin/clients');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('signed-out user hitting /admin/automations is redirected to /sign-in', async ({ page }) => {
  await page.goto('/admin/automations');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('signed-out user hitting /admin/intake is redirected to /sign-in', async ({ page }) => {
  await page.goto('/admin/intake');
  await expect(page).toHaveURL(/\/sign-in/);
});
```

**Step 2: Run e2e — expect failures for the four new routes (routes don't exist yet, will 404; redirect gate is added in this task + subsequent tasks create the pages)**

Run: `pnpm test:e2e tests/e2e/auth-gates.spec.ts`
Expected: the four new tests may 404 rather than redirect until pages exist. That's fine — they'll start passing as subsequent tasks land. The gate test for `/admin` itself should already pass.

**Step 3: Implement the role gate in layout**

Replace `app/admin/layout.tsx` with:

```tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { getRole } from '@/lib/auth/roles';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect('/sign-in?redirect_url=/admin');
  const role = getRole(user);
  if (role !== 'admin') redirect('/sign-in?need=admin');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <nav className="flex gap-6 text-sm">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/leads">Leads</Link>
          <Link href="/admin/clients">Clients</Link>
          <Link href="/admin/automations">Automations</Link>
          <Link href="/admin/intake">Intake</Link>
        </nav>
        <UserButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

**Notes:**
- `currentUser()` is async in Clerk v7.
- Non-admin signed-in users bounce to sign-in with `?need=admin` — simpler than building a 403 page. Acceptable for an internal tool.
- Added an "Overview" link — Task 3 wires the index page.

**Step 4: Verify**

- `pnpm test` — still green (no unit logic changed)
- `pnpm build` — must compile

**Step 5: Commit**

```bash
git add app/admin/layout.tsx tests/e2e/auth-gates.spec.ts
git commit -m "feat(admin): server-side admin role gate on /admin layout"
```

---

### Task 2: Shared admin primitives + formatters

**Files:**
- Create: `app/admin/_components/Table.tsx`
- Create: `app/admin/_components/EmptyState.tsx`
- Create: `app/admin/_components/StatusPill.tsx`
- Create: `app/admin/_components/formatters.ts`
- Create: `app/admin/_components/formatters.test.ts`
- Create: `app/admin/_components/StatusPill.test.ts`

**Why:** Four pages, same table shape. Extract once, write tests once. `StatusPill` has a tiny mapping (`engagement_status` + `automation_status` + `run_status` → color class) that deserves a unit test because new enum values will be added.

**Step 1: Write failing tests**

`formatters.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatDate, formatRelative, formatMoneyCents } from './formatters';

describe('formatDate', () => {
  it('renders ISO-like short date in UTC', () => {
    expect(formatDate(new Date('2026-04-14T10:23:00Z'))).toBe('2026-04-14');
  });
  it('returns em-dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });
});

describe('formatRelative', () => {
  it('returns "just now" for <60s', () => {
    const now = new Date();
    const fiveSecsAgo = new Date(now.getTime() - 5_000);
    expect(formatRelative(fiveSecsAgo, now)).toBe('just now');
  });
  it('returns minutes for <1h', () => {
    const now = new Date();
    const t = new Date(now.getTime() - 5 * 60_000);
    expect(formatRelative(t, now)).toBe('5m ago');
  });
  it('returns hours for <24h', () => {
    const now = new Date();
    const t = new Date(now.getTime() - 3 * 3600_000);
    expect(formatRelative(t, now)).toBe('3h ago');
  });
  it('returns days for >=24h', () => {
    const now = new Date();
    const t = new Date(now.getTime() - 2 * 86400_000);
    expect(formatRelative(t, now)).toBe('2d ago');
  });
  it('returns em-dash for null', () => {
    expect(formatRelative(null)).toBe('—');
  });
});

describe('formatMoneyCents', () => {
  it('formats positive cents as USD', () => {
    expect(formatMoneyCents(499_900)).toBe('$4,999.00');
  });
  it('formats zero', () => {
    expect(formatMoneyCents(0)).toBe('$0.00');
  });
  it('returns em-dash for null', () => {
    expect(formatMoneyCents(null)).toBe('—');
  });
});
```

`StatusPill.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { pillVariantFor } from './StatusPill';

describe('pillVariantFor', () => {
  it('maps engagement active to green', () => {
    expect(pillVariantFor('active')).toBe('green');
  });
  it('maps engagement onboarding to yellow', () => {
    expect(pillVariantFor('onboarding')).toBe('yellow');
  });
  it('maps engagement paused to neutral', () => {
    expect(pillVariantFor('paused')).toBe('neutral');
  });
  it('maps engagement churned to red', () => {
    expect(pillVariantFor('churned')).toBe('red');
  });
  it('maps automation live to green', () => {
    expect(pillVariantFor('live')).toBe('green');
  });
  it('maps automation error to red', () => {
    expect(pillVariantFor('error')).toBe('red');
  });
  it('maps automation draft to neutral', () => {
    expect(pillVariantFor('draft')).toBe('neutral');
  });
  it('maps run failure to red', () => {
    expect(pillVariantFor('failure')).toBe('red');
  });
  it('maps run success to green', () => {
    expect(pillVariantFor('success')).toBe('green');
  });
  it('maps run running to yellow', () => {
    expect(pillVariantFor('running')).toBe('yellow');
  });
  it('falls back to neutral for unknown', () => {
    expect(pillVariantFor('???' as never)).toBe('neutral');
  });
});
```

**Step 2: Run to verify fail**

Run: `pnpm test app/admin/_components`
Expected: all fail (modules don't exist yet).

**Step 3: Implement**

`app/admin/_components/formatters.ts`:

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
  const deltaMs = now.getTime() - date.getTime();
  const deltaSec = Math.floor(deltaMs / 1000);
  if (deltaSec < 60) return 'just now';
  const deltaMin = Math.floor(deltaSec / 60);
  if (deltaMin < 60) return `${deltaMin}m ago`;
  const deltaHr = Math.floor(deltaMin / 60);
  if (deltaHr < 24) return `${deltaHr}h ago`;
  const deltaDay = Math.floor(deltaHr / 24);
  return `${deltaDay}d ago`;
}

export function formatMoneyCents(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
```

`app/admin/_components/StatusPill.tsx`:

```tsx
export type PillStatus =
  | 'onboarding' | 'active' | 'paused' | 'churned'
  | 'draft' | 'live' | 'error'
  | 'success' | 'failure' | 'running';

export type PillVariant = 'green' | 'yellow' | 'red' | 'neutral';

export function pillVariantFor(status: PillStatus): PillVariant {
  switch (status) {
    case 'active':
    case 'live':
    case 'success':
      return 'green';
    case 'onboarding':
    case 'running':
      return 'yellow';
    case 'churned':
    case 'error':
    case 'failure':
      return 'red';
    case 'paused':
    case 'draft':
      return 'neutral';
    default:
      return 'neutral';
  }
}

const variantClass: Record<PillVariant, string> = {
  green: 'bg-green-100 text-green-800 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
};

export function StatusPill({ status }: { status: PillStatus }) {
  const variant = pillVariantFor(status);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${variantClass[variant]}`}
    >
      {status}
    </span>
  );
}
```

`app/admin/_components/EmptyState.tsx`:

```tsx
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border border-dashed rounded-lg p-8 text-center">
      <p className="text-sm font-medium text-neutral-700">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      )}
    </div>
  );
}
```

`app/admin/_components/Table.tsx`:

```tsx
import type { ReactNode } from 'react';

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function Table<T extends { id: number | string }>({
  columns,
  rows,
  emptyFallback,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyFallback?: ReactNode;
}) {
  if (rows.length === 0 && emptyFallback) return <>{emptyFallback}</>;
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left">
          <tr>
            {columns.map((c) => (
              <th
                key={c.header}
                className={`px-3 py-2 font-medium text-neutral-600 ${c.className ?? ''}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              {columns.map((c) => (
                <td
                  key={c.header}
                  className={`px-3 py-2 align-top ${c.className ?? ''}`}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 4: Verify**

Run: `pnpm test app/admin/_components`
Expected: all pass (~14 tests).

**Step 5: Commit**

```bash
git add app/admin/_components
git commit -m "feat(admin): shared table, empty-state, pill primitives + formatters"
```

---

### Task 3: Admin dashboard index (overview tiles)

**Files:**
- Modify: `app/admin/page.tsx`
- Create: `lib/admin/counts.ts`
- Create: `lib/admin/counts.test.ts`

**Why:** Lands a useful `/admin` home. Also factors the count query so it's testable and reusable.

**Step 1: Write failing test**

`lib/admin/counts.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOverviewCounts } from './counts';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

// We'll use a thin integration approach: drive the real query with seeded rows.
// Since the counts helper just wraps `count()` over each table, a mock-based
// unit test is low-value. Instead we smoke-test the shape.
describe('getOverviewCounts', () => {
  it('returns numeric counts for each surface', async () => {
    const { db } = await import('@/lib/db');
    // Each select().from(table) chain resolves to [{ value: number }]
    const chain = { from: vi.fn().mockResolvedValue([{ value: 0 }]) };
    (db.select as any).mockReturnValue(chain);
    const result = await getOverviewCounts();
    expect(result).toEqual({
      leads: 0,
      engagements: 0,
      automations: 0,
      intakeSubmissions: 0,
    });
  });
});
```

**Step 2: Run to verify fail**

Run: `pnpm test lib/admin/counts.test.ts`
Expected: fail (module missing).

**Step 3: Implement**

`lib/admin/counts.ts`:

```ts
import { count } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  leads,
  engagements,
  automations,
  intakeSubmissions,
} from '@/lib/db/schema';

export type OverviewCounts = {
  leads: number;
  engagements: number;
  automations: number;
  intakeSubmissions: number;
};

export async function getOverviewCounts(): Promise<OverviewCounts> {
  const [l, e, a, i] = await Promise.all([
    db.select({ value: count() }).from(leads),
    db.select({ value: count() }).from(engagements),
    db.select({ value: count() }).from(automations),
    db.select({ value: count() }).from(intakeSubmissions),
  ]);
  return {
    leads: l[0]?.value ?? 0,
    engagements: e[0]?.value ?? 0,
    automations: a[0]?.value ?? 0,
    intakeSubmissions: i[0]?.value ?? 0,
  };
}
```

`app/admin/page.tsx`:

```tsx
import Link from 'next/link';
import { getOverviewCounts } from '@/lib/admin/counts';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const counts = await getOverviewCounts();
  const tiles: Array<{ label: string; href: string; value: number }> = [
    { label: 'Leads', href: '/admin/leads', value: counts.leads },
    { label: 'Clients', href: '/admin/clients', value: counts.engagements },
    { label: 'Automations', href: '/admin/automations', value: counts.automations },
    { label: 'Intake submissions', href: '/admin/intake', value: counts.intakeSubmissions },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className="border rounded-lg p-4 hover:bg-neutral-50"
        >
          <p className="text-xs text-neutral-500 uppercase tracking-wide">
            {t.label}
          </p>
          <p className="mt-2 text-2xl font-semibold">{t.value}</p>
        </Link>
      ))}
    </div>
  );
}
```

**Step 4: Verify**

- `pnpm test lib/admin/counts.test.ts` — green
- `pnpm build` — compiles

**Step 5: Commit**

```bash
git add app/admin/page.tsx lib/admin/counts.ts lib/admin/counts.test.ts
git commit -m "feat(admin): overview tiles showing counts per surface"
```

---

### Task 4: `/admin/leads` — list + Convert-to-client modal

**Files:**
- Create: `app/admin/leads/page.tsx`
- Create: `app/admin/leads/ConvertLeadButton.tsx`
- Create: `lib/admin/leads.ts`

**Why:** The single piece of admin write-action Phase 3 owns. The button POSTs to the Phase 2 `/api/admin/engagements/create-from-lead` endpoint and surfaces the resulting magic-link URL so the admin can verify delivery (or copy it if Resend fails).

**Step 1: Implement query helper**

`lib/admin/leads.ts`:

```ts
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';

export async function listLeads() {
  return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(200);
}
```

No unit test — thin Drizzle wrapper; the E2E sign-in-gate test covers routing, and there's no logic to verify.

**Step 2: Implement the page (server component)**

`app/admin/leads/page.tsx`:

```tsx
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import {
  formatDate,
  formatRelative,
} from '@/app/admin/_components/formatters';
import { ConvertLeadButton } from './ConvertLeadButton';
import { listLeads } from '@/lib/admin/leads';
import type { Lead } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const rows = await listLeads();

  const columns: Column<Lead>[] = [
    { header: 'Email', cell: (r) => r.email },
    { header: 'Industry', cell: (r) => r.industry },
    { header: 'Situation', cell: (r) => r.situationText.slice(0, 80), className: 'max-w-sm' },
    { header: 'Booked', cell: (r) => formatDate(r.bookedAt) },
    { header: 'Created', cell: (r) => formatRelative(r.createdAt) },
    { header: 'Action', cell: (r) => <ConvertLeadButton leadId={r.id} email={r.email} /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Leads</h1>
      <Table
        columns={columns}
        rows={rows}
        emptyFallback={<EmptyState title="No leads yet" description="Leads appear here as prospects submit the demo." />}
      />
    </div>
  );
}
```

**Step 3: Implement the client-island convert button**

`app/admin/leads/ConvertLeadButton.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';

type Result =
  | { ok: true; engagementId: number; emailSent: boolean; url?: string }
  | { ok: false; error: string };

export function ConvertLeadButton({
  leadId,
  email,
}: {
  leadId: number;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [fee, setFee] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/engagements/create-from-lead', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            leadId,
            companyName,
            monthlyFeeCents: fee ? Number(fee) * 100 : undefined,
          }),
        });
        const body = await res.json();
        if (!res.ok && res.status !== 207) {
          setResult({ ok: false, error: body.error ?? `http-${res.status}` });
          return;
        }
        setResult({
          ok: true,
          engagementId: body.engagementId,
          emailSent: body.emailSent,
          url: body.url,
        });
      } catch (e) {
        setResult({ ok: false, error: e instanceof Error ? e.message : 'unknown' });
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs rounded border px-2 py-1 hover:bg-neutral-50"
      >
        Convert to client
      </button>
    );
  }

  return (
    <div className="rounded border p-2 space-y-2 bg-neutral-50 text-xs min-w-[260px]">
      <p className="text-neutral-600">Converting {email}</p>
      <input
        aria-label="Company name"
        placeholder="Company name"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        className="w-full border rounded px-2 py-1"
      />
      <input
        aria-label="Monthly fee (USD)"
        placeholder="Monthly fee (USD, optional)"
        inputMode="numeric"
        value={fee}
        onChange={(e) => setFee(e.target.value.replace(/[^\d]/g, ''))}
        className="w-full border rounded px-2 py-1"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || companyName.length < 2}
          className="rounded bg-black text-white px-2 py-1 disabled:opacity-50"
        >
          {isPending ? 'Sending…' : 'Create + send link'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setResult(null);
          }}
          className="rounded border px-2 py-1"
        >
          Cancel
        </button>
      </div>
      {result && result.ok && (
        <div className="text-green-700 space-y-1">
          <p>Engagement #{result.engagementId} created.</p>
          <p>
            Email {result.emailSent ? 'sent' : 'NOT sent (check logs)'}.
          </p>
          {result.url && (
            <p className="break-all">
              Link:{' '}
              <a className="underline" href={result.url}>
                {result.url}
              </a>
            </p>
          )}
        </div>
      )}
      {result && !result.ok && (
        <p className="text-red-700">Error: {result.error}</p>
      )}
    </div>
  );
}
```

**Notes:**
- Client-side form validation is minimal (companyName ≥ 2). Server is the source of truth via Zod.
- HTTP 207 is the Phase 2 contract for "engagement created but email failed" — we treat it as success and surface the URL.
- Intentionally no modal overlay library. Inline panel keeps it a one-file island.

**Step 4: Verify**

- `pnpm build` — compiles
- Manual: sign in as admin, visit `/admin/leads`, see table (empty is fine), click Convert, submit against a seeded lead.

**Step 5: Commit**

```bash
git add app/admin/leads lib/admin/leads.ts
git commit -m "feat(admin): leads table with convert-to-client action"
```

---

### Task 5: `/admin/clients` — list + detail

**Files:**
- Create: `app/admin/clients/page.tsx`
- Create: `app/admin/clients/[id]/page.tsx`
- Create: `lib/admin/clients.ts`

**Why:** Primary surface for "who are my customers and what's their status." Detail page joins engagement + lead + latest intake submission.

**Step 1: Implement query helpers**

`lib/admin/clients.ts`:

```ts
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  engagements,
  leads,
  intakeSubmissions,
} from '@/lib/db/schema';

export async function listEngagementsWithLead() {
  return db
    .select({
      id: engagements.id,
      companyName: engagements.companyName,
      status: engagements.status,
      startedAt: engagements.startedAt,
      monthlyFeeCents: engagements.monthlyFeeCents,
      leadEmail: leads.email,
      leadIndustry: leads.industry,
    })
    .from(engagements)
    .leftJoin(leads, eq(engagements.leadId, leads.id))
    .orderBy(desc(engagements.startedAt))
    .limit(200);
}

export async function getEngagementDetail(id: number) {
  const [engagement] = await db
    .select()
    .from(engagements)
    .where(eq(engagements.id, id))
    .limit(1);
  if (!engagement) return null;

  const lead = engagement.leadId
    ? (await db.select().from(leads).where(eq(leads.id, engagement.leadId)).limit(1))[0] ?? null
    : null;

  const [intake] = await db
    .select()
    .from(intakeSubmissions)
    .where(eq(intakeSubmissions.engagementId, id))
    .orderBy(desc(intakeSubmissions.submittedAt))
    .limit(1);

  return { engagement, lead, intake: intake ?? null };
}
```

**Step 2: Implement list page**

`app/admin/clients/page.tsx`:

```tsx
import Link from 'next/link';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import {
  formatDate,
  formatMoneyCents,
} from '@/app/admin/_components/formatters';
import { listEngagementsWithLead } from '@/lib/admin/clients';

export const dynamic = 'force-dynamic';

type Row = Awaited<ReturnType<typeof listEngagementsWithLead>>[number];

export default async function ClientsPage() {
  const rows = await listEngagementsWithLead();

  const columns: Column<Row>[] = [
    {
      header: 'Company',
      cell: (r) => (
        <Link href={`/admin/clients/${r.id}`} className="underline">
          {r.companyName}
        </Link>
      ),
    },
    { header: 'Email', cell: (r) => r.leadEmail ?? '—' },
    { header: 'Industry', cell: (r) => r.leadIndustry ?? '—' },
    { header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
    { header: 'Fee/mo', cell: (r) => formatMoneyCents(r.monthlyFeeCents) },
    { header: 'Started', cell: (r) => formatDate(r.startedAt) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Clients</h1>
      <Table
        columns={columns}
        rows={rows}
        emptyFallback={
          <EmptyState
            title="No engagements yet"
            description="Convert a lead from /admin/leads to create the first engagement."
          />
        }
      />
    </div>
  );
}
```

**Step 3: Implement detail page**

`app/admin/clients/[id]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import {
  formatDate,
  formatMoneyCents,
} from '@/app/admin/_components/formatters';
import { getEngagementDetail } from '@/lib/admin/clients';

export const dynamic = 'force-dynamic';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const detail = await getEngagementDetail(id);
  if (!detail) notFound();

  const { engagement, lead, intake } = detail;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/clients" className="text-sm underline">
          ← All clients
        </Link>
      </div>

      <section>
        <h1 className="text-lg font-semibold">{engagement.companyName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-neutral-600">
          <StatusPill status={engagement.status} />
          <span>Started {formatDate(engagement.startedAt)}</span>
          <span>Fee {formatMoneyCents(engagement.monthlyFeeCents)}</span>
          <span>Engagement #{engagement.id}</span>
        </div>
      </section>

      <section className="border rounded-lg p-4">
        <h2 className="text-sm font-medium">Lead</h2>
        {lead ? (
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-neutral-500">Email</dt>
            <dd>{lead.email}</dd>
            <dt className="text-neutral-500">Industry</dt>
            <dd>{lead.industry}</dd>
            <dt className="text-neutral-500">Situation</dt>
            <dd className="whitespace-pre-wrap">{lead.situationText}</dd>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">No lead linked.</p>
        )}
      </section>

      <section className="border rounded-lg p-4">
        <h2 className="text-sm font-medium">Intake</h2>
        {intake ? (
          <p className="mt-2 text-sm">
            Submitted {formatDate(intake.submittedAt)} —{' '}
            <Link href={`/admin/intake/${intake.id}`} className="underline">
              view submission
            </Link>
          </p>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            Not yet submitted. Client needs to complete the onboarding link.
          </p>
        )}
      </section>
    </div>
  );
}
```

**Step 4: Verify**

- `pnpm build` — compiles
- Manual: list page links to detail; detail 404s on bad id.

**Step 5: Commit**

```bash
git add app/admin/clients lib/admin/clients.ts
git commit -m "feat(admin): clients list + detail with joined lead and intake"
```

---

### Task 6: `/admin/automations` — list with empty state

**Files:**
- Create: `app/admin/automations/page.tsx`
- Create: `lib/admin/automations.ts`

**Why:** No data until Phase 4, but the surface must exist so the admin nav doesn't 404 and Phase 5's end-to-end rehearsal has all four tables to click through.

**Step 1: Implement query helper**

`lib/admin/automations.ts`:

```ts
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { automations, engagements } from '@/lib/db/schema';

export async function listAutomationsWithCompany() {
  return db
    .select({
      id: automations.id,
      name: automations.name,
      description: automations.description,
      status: automations.status,
      n8nWorkflowId: automations.n8nWorkflowId,
      createdAt: automations.createdAt,
      companyName: engagements.companyName,
      engagementId: automations.engagementId,
    })
    .from(automations)
    .leftJoin(engagements, eq(automations.engagementId, engagements.id))
    .orderBy(desc(automations.createdAt))
    .limit(200);
}
```

**Step 2: Implement page**

`app/admin/automations/page.tsx`:

```tsx
import Link from 'next/link';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import {
  formatDate,
} from '@/app/admin/_components/formatters';
import { listAutomationsWithCompany } from '@/lib/admin/automations';

export const dynamic = 'force-dynamic';

type Row = Awaited<ReturnType<typeof listAutomationsWithCompany>>[number];

export default async function AutomationsPage() {
  const rows = await listAutomationsWithCompany();

  const columns: Column<Row>[] = [
    { header: 'Name', cell: (r) => r.name },
    {
      header: 'Client',
      cell: (r) =>
        r.companyName ? (
          <Link href={`/admin/clients/${r.engagementId}`} className="underline">
            {r.companyName}
          </Link>
        ) : (
          '—'
        ),
    },
    { header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
    { header: 'n8n workflow', cell: (r) => r.n8nWorkflowId ?? '—' },
    { header: 'Created', cell: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Automations</h1>
      <Table
        columns={columns}
        rows={rows}
        emptyFallback={
          <EmptyState
            title="No automations yet"
            description="Phase 4 wires the n8n webhook that populates this table."
          />
        }
      />
    </div>
  );
}
```

**Step 3: Verify**

- `pnpm build` — compiles
- Manual: page renders the empty state.

**Step 4: Commit**

```bash
git add app/admin/automations lib/admin/automations.ts
git commit -m "feat(admin): automations table with phase-4 empty state"
```

---

### Task 7: `/admin/intake` — list + detail

**Files:**
- Create: `app/admin/intake/page.tsx`
- Create: `app/admin/intake/[id]/page.tsx`
- Create: `lib/admin/intake.ts`

**Why:** Completes the fourth table. Detail view renders the `toolsJson`/goals/constraints so Raijuu can actually act on what a client submitted.

**Step 1: Implement query helpers**

`lib/admin/intake.ts`:

```ts
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { intakeSubmissions, engagements } from '@/lib/db/schema';

export async function listIntakeSubmissions() {
  return db
    .select({
      id: intakeSubmissions.id,
      engagementId: intakeSubmissions.engagementId,
      submittedAt: intakeSubmissions.submittedAt,
      companyName: engagements.companyName,
      engagementStatus: engagements.status,
    })
    .from(intakeSubmissions)
    .leftJoin(engagements, eq(intakeSubmissions.engagementId, engagements.id))
    .orderBy(desc(intakeSubmissions.submittedAt))
    .limit(200);
}

export async function getIntakeDetail(id: number) {
  const [row] = await db
    .select({
      submission: intakeSubmissions,
      engagement: engagements,
    })
    .from(intakeSubmissions)
    .leftJoin(engagements, eq(intakeSubmissions.engagementId, engagements.id))
    .where(eq(intakeSubmissions.id, id))
    .limit(1);
  return row ?? null;
}
```

**Step 2: Implement list page**

`app/admin/intake/page.tsx`:

```tsx
import Link from 'next/link';
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { StatusPill } from '@/app/admin/_components/StatusPill';
import {
  formatRelative,
} from '@/app/admin/_components/formatters';
import { listIntakeSubmissions } from '@/lib/admin/intake';

export const dynamic = 'force-dynamic';

type Row = Awaited<ReturnType<typeof listIntakeSubmissions>>[number];

export default async function IntakePage() {
  const rows = await listIntakeSubmissions();

  const columns: Column<Row>[] = [
    {
      header: 'Submission',
      cell: (r) => (
        <Link href={`/admin/intake/${r.id}`} className="underline">
          #{r.id}
        </Link>
      ),
    },
    { header: 'Company', cell: (r) => r.companyName ?? '—' },
    {
      header: 'Engagement',
      cell: (r) =>
        r.engagementStatus ? <StatusPill status={r.engagementStatus} /> : '—',
    },
    { header: 'Submitted', cell: (r) => formatRelative(r.submittedAt) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Intake submissions</h1>
      <Table
        columns={columns}
        rows={rows}
        emptyFallback={
          <EmptyState
            title="No submissions yet"
            description="Submissions appear here after clients complete the /onboard/[id] flow."
          />
        }
      />
    </div>
  );
}
```

**Step 3: Implement detail page**

`app/admin/intake/[id]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate } from '@/app/admin/_components/formatters';
import { getIntakeDetail } from '@/lib/admin/intake';

export const dynamic = 'force-dynamic';

type ToolsJson = { tools?: string[]; customTools?: string } | null;

export default async function IntakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const detail = await getIntakeDetail(id);
  if (!detail) notFound();

  const { submission, engagement } = detail;
  const tools = submission.toolsJson as ToolsJson;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/intake" className="text-sm underline">
          ← All submissions
        </Link>
      </div>

      <section>
        <h1 className="text-lg font-semibold">Submission #{submission.id}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {engagement?.companyName ?? 'Unknown company'} —{' '}
          submitted {formatDate(submission.submittedAt)}
        </p>
        {engagement && (
          <p className="mt-1 text-sm">
            <Link
              href={`/admin/clients/${engagement.id}`}
              className="underline"
            >
              View client
            </Link>
          </p>
        )}
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-medium">Tools</h2>
        <p className="text-sm">
          {tools?.tools?.length ? tools.tools.join(', ') : '—'}
        </p>
        {tools?.customTools && (
          <p className="text-sm text-neutral-600">
            Custom: {tools.customTools}
          </p>
        )}
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-medium">Goals</h2>
        <pre className="text-sm whitespace-pre-wrap font-sans">
          {submission.goalsText}
        </pre>
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-medium">Credentials pointer</h2>
        <p className="text-sm break-all">
          {submission.credentialsVaultRef ?? '— (client did not share a link)'}
        </p>
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-medium">Constraints</h2>
        <p className="text-sm whitespace-pre-wrap">
          {submission.constraintsText ?? '—'}
        </p>
      </section>
    </div>
  );
}
```

**Step 4: Verify**

- `pnpm build` — compiles
- Manual: detail shows a seeded submission correctly.

**Step 5: Commit**

```bash
git add app/admin/intake lib/admin/intake.ts
git commit -m "feat(admin): intake list + detail with submission contents"
```

---

### Task 8: README + env note for admin role grant

**Files:**
- Modify: `README.md`

**Why:** The admin role gate is new. First contributor will need the runbook for marking a Clerk user as admin so they can actually use `/admin/*`.

**Implementation:** Add a short "Grant admin access" section to the README explaining:

1. Sign up via `/sign-up`.
2. In Clerk Dashboard → Users → pick user → Public metadata, set `{ "role": "admin" }`.
3. Sign out and back in to refresh the session JWT.
4. Visit `/admin` — overview tiles should render.

No code changes, no tests.

**Commit:**

```bash
git add README.md
git commit -m "docs(admin): runbook for granting admin role via clerk metadata"
```

---

### Task 9: Phase 3 verification + merge

**Steps:**

1. `pnpm test` — all unit tests green (~44+ tests: Phase 0 + 1 + 2 baseline ~30 + formatters ~8 + pill ~11 + counts ~1 = ~50).
2. `pnpm test:e2e` — all green (6 prior + 4 new auth-gate routes = 10).
3. `pnpm build` — green.
4. Manual pre-flight on localhost with an admin Clerk account:
   - [ ] `/admin` shows four tiles with correct counts
   - [ ] `/admin/leads` shows seeded leads; Convert button creates an engagement and reveals the magic-link URL
   - [ ] `/admin/clients` shows the new engagement; detail page shows lead + (no intake yet)
   - [ ] Complete the magic link flow → return to `/admin/clients/[id]` → intake link now visible
   - [ ] `/admin/intake` shows the submission; detail shows tools/goals correctly
   - [ ] `/admin/automations` shows empty state
   - [ ] Sign out → `/admin` redirects to sign-in
   - [ ] Sign in as a non-admin test user → `/admin` redirects to sign-in with `?need=admin`
5. Commit nothing new in this task; create PR / merge.

```bash
git log --oneline -12   # sanity check: 8 Phase 3 commits
```

---

## Phase 3 Done When

- [ ] `pnpm test` green
- [ ] `pnpm test:e2e` green
- [ ] `pnpm build` green
- [ ] Manual pre-flight checklist above passes
- [ ] Non-admin signed-in user cannot access any `/admin/*` route

## What Phase 4 Will Pick Up

Phase 4 (Client Portal) adds `/app/*` views over the same data model, plus `/api/n8n/run-callback` webhook + monthly cron that aggregates runs into `outcomes_monthly`. The automations table's empty state in this phase starts showing real rows once that webhook lands.