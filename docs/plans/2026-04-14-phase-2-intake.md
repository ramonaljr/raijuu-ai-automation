# Raijuu Dashboard — Phase 2: Intake Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship `/onboard/[engagementId]` — a magic-link-gated multi-step form where a newly-signed client hands over their tool inventory, credential-sharing link, top 3 target automations, and success metrics. Submission flips the engagement from `onboarding` → `active` and notifies admin.

**Architecture:** Magic link = signed URL with `engagement_id` + `magic_link_token` (already on table, UUID `defaultRandom()`). Verification compares URL token to DB token — no JWT, no session. Form state is client-side until final submit. No credentials touch our DB — just a pointer string (e.g. a 1Password share URL or Doppler invite URL). Resend delivers the link. An admin-only API endpoint creates an engagement for a lead and sends the link.

**Tech Stack:** Next.js 16.2.3, Clerk (admin gate on send endpoint), Drizzle, Resend (required now — no longer optional), Zod 4, Framer Motion.

**Reference design:** `docs/plans/2026-04-13-dashboard-design.md` §5.2.

**Pre-flight rules** carried over from Phase 0/1 plans (Next 16, Clerk v7 async auth, Zod 4 API, pnpm only, no `git add .`).

---

## Phase 2 Scope

In:
- `lib/intake/magic-link.ts` — URL builder + token verification
- `lib/intake/schema.ts` — Zod schemas for form submission
- `/onboard/[engagementId]` route with token query-param verification
- Multi-step intake client component (5 steps)
- `submitIntake` server action → writes `intake_submissions`, updates `engagements.status`, notifies admin
- `/api/admin/engagements/create-from-lead` endpoint (admin-auth'd) → creates engagement from a lead + sends magic link email
- Resend email template for the magic link
- E2E happy path (seeded engagement fixture)

Out (deferred):
- Admin UI button to trigger `/api/admin/engagements/create-from-lead` (Phase 3)
- Credential vaulting logic (we just store a URL pointer)
- Multi-round intake (single submission, no partial-save)
- Internationalization
- File uploads (mentioned in design but not v1)

---

### Task 1: Magic-link helpers + tests

**Files:**
- Create: `lib/intake/magic-link.ts`
- Create: `lib/intake/magic-link.test.ts`

**Implementation** (`magic-link.ts`):

```ts
import { db } from '@/lib/db';
import { engagements } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export function buildMagicLinkUrl(baseUrl: string, engagementId: number, token: string): string {
  const u = new URL(`/onboard/${engagementId}`, baseUrl);
  u.searchParams.set('token', token);
  return u.toString();
}

export async function verifyMagicLink(engagementId: number, token: string): Promise<{ ok: true } | { ok: false; reason: 'not-found' | 'token-mismatch' | 'already-submitted' }> {
  if (!token || typeof token !== 'string' || token.length < 16) return { ok: false, reason: 'token-mismatch' };
  const rows = await db.select().from(engagements).where(eq(engagements.id, engagementId)).limit(1);
  const engagement = rows[0];
  if (!engagement) return { ok: false, reason: 'not-found' };
  if (engagement.magicLinkToken !== token) return { ok: false, reason: 'token-mismatch' };
  if (engagement.status !== 'onboarding') return { ok: false, reason: 'already-submitted' };
  return { ok: true };
}
```

**Tests** (`magic-link.test.ts`):

```ts
import { describe, it, expect } from 'vitest';
import { buildMagicLinkUrl } from './magic-link';

describe('buildMagicLinkUrl', () => {
  it('composes the URL with token query param', () => {
    const url = buildMagicLinkUrl('https://raijuu.ai', 42, 'abc-def-token');
    expect(url).toBe('https://raijuu.ai/onboard/42?token=abc-def-token');
  });
  it('preserves trailing slash behavior', () => {
    expect(buildMagicLinkUrl('https://example.com', 1, 't')).toContain('/onboard/1?token=t');
  });
  it('URL-encodes the token', () => {
    expect(buildMagicLinkUrl('https://x.io', 1, 'a b+c')).toContain('token=a+b%2Bc');
  });
});
```

(No `verifyMagicLink` unit tests — covered by the E2E in Task 8. Mocking `db` for this thin query would add maintenance without real coverage.)

**Commit:**
```bash
git add lib/intake/magic-link.ts lib/intake/magic-link.test.ts
git commit -m "feat(intake): magic link URL builder + verifier"
```

---

### Task 2: Intake submission schema

**Files:**
- Create: `lib/intake/schema.ts`
- Create: `lib/intake/schema.test.ts`

**Implementation:**

```ts
import { z } from 'zod';

export const KNOWN_TOOLS = [
  'gmail', 'slack', 'hubspot', 'google-sheets', 'airtable', 'notion',
  'zapier', 'stripe', 'shopify', 'intercom', 'zendesk', 'calendly', 'linear',
] as const;

export const intakeSubmissionSchema = z.object({
  companyName: z.string().min(2).max(120),
  role: z.string().min(2).max(60),
  tools: z.array(z.enum(KNOWN_TOOLS)).min(1),
  customTools: z.string().max(200).optional(),
  credentialsVaultUrl: z.string().url().max(500).optional(),
  goals: z.array(z.string().min(5).max(200)).length(3),
  successMetric: z.string().min(10).max(300),
  constraints: z.string().max(500).optional(),
});

export type IntakeSubmission = z.infer<typeof intakeSubmissionSchema>;
```

**Tests:** Five-ish cases covering happy path, min/max validation, unknown tool rejection, wrong goal count, invalid credential URL.

**Commit:**
```bash
git add lib/intake/schema.ts lib/intake/schema.test.ts
git commit -m "feat(intake): zod schema for intake submission"
```

---

### Task 3: Resend email template for magic link

**Files:**
- Create: `lib/intake/email.ts`

**Implementation:**

```ts
export async function sendMagicLinkEmail(params: {
  to: string;
  companyName: string;
  magicLinkUrl: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    console.log('[intake] magic link would send to', params.to, params.magicLinkUrl);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: `Welcome to Raijuu — onboarding for ${params.companyName}`,
      html: renderMagicLinkHtml(params.companyName, params.magicLinkUrl),
      text: renderMagicLinkText(params.companyName, params.magicLinkUrl),
    }),
  });
  if (!res.ok) {
    throw new Error(`[intake] magic link send failed ${res.status}: ${await res.text()}`);
  }
}

function renderMagicLinkText(companyName: string, url: string): string {
  return [
    `Hi from Raijuu — excited to get started with ${companyName}.`,
    ``,
    `Next step: spend 10 minutes answering a few questions about your tools, goals, and how we share credentials.`,
    ``,
    `Your onboarding link (expires when you submit):`,
    url,
    ``,
    `—`,
    `Raijuu AI Automation`,
  ].join('\n');
}

function renderMagicLinkHtml(companyName: string, url: string): string {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <h1 style="font-size:20px;margin:0 0 16px">Welcome to Raijuu</h1>
    <p>Excited to get started with <strong>${escapeHtml(companyName)}</strong>.</p>
    <p>Next step: spend ~10 minutes answering a few questions about your tools, goals, and how we share credentials.</p>
    <p style="margin:32px 0"><a href="${escapeAttr(url)}" style="display:inline-block;background:#4d65ff;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">Start onboarding</a></p>
    <p style="color:#555;font-size:12px">Or paste this link into your browser: ${escapeHtml(url)}</p>
  </body></html>`;
}

function escapeHtml(s: string): string { return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!)); }
function escapeAttr(s: string): string { return s.replace(/["'<>&]/g, (c) => ({ '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!)); }
```

No tests — pure integration; covered by E2E when RESEND_API_KEY is set. If unset, logs to console (dev-friendly).

**Commit:**
```bash
git add lib/intake/email.ts
git commit -m "feat(intake): magic link email template via resend"
```

---

### Task 4: Admin API — create engagement from lead + send magic link

**Files:**
- Create: `app/api/admin/engagements/create-from-lead/route.ts`

**Implementation:**

```ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { engagements, leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { buildMagicLinkUrl } from '@/lib/intake/magic-link';
import { sendMagicLinkEmail } from '@/lib/intake/email';

const bodySchema = z.object({
  leadId: z.number().int().positive(),
  companyName: z.string().min(2).max(120),
  monthlyFeeCents: z.number().int().nonnegative().optional(),
});

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
  if (role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.issues }, { status: 400 });

  const leadRows = await db.select().from(leads).where(eq(leads.id, parsed.data.leadId)).limit(1);
  const lead = leadRows[0];
  if (!lead) return NextResponse.json({ error: 'lead-not-found' }, { status: 404 });

  const [engagement] = await db.insert(engagements).values({
    leadId: lead.id,
    companyName: parsed.data.companyName,
    monthlyFeeCents: parsed.data.monthlyFeeCents,
  }).returning();

  const baseUrl = process.env.APP_BASE_URL ?? new URL(req.url).origin;
  const url = buildMagicLinkUrl(baseUrl, engagement.id, engagement.magicLinkToken);

  try {
    await sendMagicLinkEmail({ to: lead.email, companyName: parsed.data.companyName, magicLinkUrl: url });
  } catch (err) {
    console.error('[intake] send failed; engagement created but link not delivered', err);
    return NextResponse.json({ engagementId: engagement.id, emailSent: false, url }, { status: 207 });
  }

  return NextResponse.json({ engagementId: engagement.id, emailSent: true });
}
```

**Notes:**
- Returns the magic link URL in both success and partial-success responses so the admin can manually share it if email fails.
- `APP_BASE_URL` env var optional; falls back to request origin.
- If Resend is misconfigured (no API key), `sendMagicLinkEmail` logs and returns — we treat that as success in the happy path; the "207" is only for actual HTTP failures.

**Commit:**
```bash
git add app/api/admin/engagements/create-from-lead/route.ts
git commit -m "feat(intake): admin API to create engagement + send magic link"
```

---

### Task 5: `/onboard/[engagementId]` server component — verification gate

**Files:**
- Create: `app/onboard/[engagementId]/page.tsx`

**Implementation:**

```tsx
import { notFound } from 'next/navigation';
import { verifyMagicLink } from '@/lib/intake/magic-link';
import { db } from '@/lib/db';
import { engagements } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { IntakeFlow } from './IntakeFlow';

export const dynamic = 'force-dynamic';

export default async function OnboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ engagementId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { engagementId: idStr } = await params;
  const { token } = await searchParams;
  const engagementId = Number(idStr);
  if (!Number.isInteger(engagementId) || engagementId <= 0) notFound();

  const check = await verifyMagicLink(engagementId, token ?? '');
  if (!check.ok) {
    return <IntakeGate reason={check.reason} />;
  }

  const [engagement] = await db.select().from(engagements).where(eq(engagements.id, engagementId)).limit(1);
  return <IntakeFlow engagementId={engagementId} token={token!} companyName={engagement.companyName} />;
}

function IntakeGate({ reason }: { reason: string }) {
  const messages: Record<string, string> = {
    'not-found': 'We can\'t find that onboarding link. Double-check the email we sent you.',
    'token-mismatch': 'That link is invalid or has been replaced. Ask Raijuu to resend it.',
    'already-submitted': 'You\'ve already completed onboarding. We\'re building your automations now.',
  };
  return (
    <main className="min-h-screen bg-dark-bg text-white flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-3">Onboarding link</h1>
        <p className="text-white/60">{messages[reason] ?? 'Unknown issue.'}</p>
      </div>
    </main>
  );
}
```

**Commit:**
```bash
git add app/onboard/[engagementId]/page.tsx
git commit -m "feat(intake): /onboard/[id] route with magic-link verification"
```

---

### Task 6: Intake flow client component (5 steps)

**Files:**
- Create: `app/onboard/[engagementId]/IntakeFlow.tsx`

**Steps:**
1. Welcome + confirm company/role (pre-fill `companyName` from prop, user types their name/role)
2. Tool inventory — checkboxes for `KNOWN_TOOLS` + "Other" free-text
3. Credential sharing — single URL input (explain: "paste a 1Password share URL or Doppler invite here; leave blank if you'll handle it separately")
4. Top 3 target automations — three textareas
5. Success metric + constraints — one required textarea + one optional

Final submit → call `submitIntake` server action → show success screen.

**Skeleton implementation:**

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitIntake } from './actions';
import { KNOWN_TOOLS } from '@/lib/intake/schema';

type Step = 1 | 2 | 3 | 4 | 5 | 'submitting' | 'done' | 'error';

export function IntakeFlow({
  engagementId,
  token,
  companyName,
}: {
  engagementId: number;
  token: string;
  companyName: string;
}) {
  const [step, setStep] = useState<Step>(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    companyName,
    role: '',
    tools: [] as string[],
    customTools: '',
    credentialsVaultUrl: '',
    goals: ['', '', ''] as [string, string, string],
    successMetric: '',
    constraints: '',
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function handleFinalSubmit() {
    setStep('submitting');
    const fd = new FormData();
    fd.set('engagementId', String(engagementId));
    fd.set('token', token);
    fd.set('payload', JSON.stringify(form));
    const res = await submitIntake(fd);
    if (res.ok) {
      setStep('done');
    } else {
      setErrorMsg(res.error);
      setStep('error');
    }
  }

  // Render body based on step — one panel per step, Next/Back buttons, AnimatePresence
  // ... implementer: fill in the UI for each step using the Phase 1 visual pattern
  // (bg-dark-bg, bg-dark-surface, border-dark-border, bg-accent for buttons)

  return <div>/* step UI */</div>;
}
```

**Implementer discretion:** Build out the 5-step UI mimicking the Phase 1 `DemoFlow.tsx` pattern (same palette, same Framer Motion `AnimatePresence mode="wait"`). Each step has a Next button that validates that step's fields locally before advancing. Step 5 has a Submit button that calls `handleFinalSubmit`.

**Commit:**
```bash
git add app/onboard/[engagementId]/IntakeFlow.tsx
git commit -m "feat(intake): multi-step client flow"
```

---

### Task 7: `submitIntake` server action

**Files:**
- Create: `app/onboard/[engagementId]/actions.ts`

**Implementation:**

```ts
'use server';

import { db } from '@/lib/db';
import { engagements, intakeSubmissions } from '@/lib/db/schema';
import { intakeSubmissionSchema } from '@/lib/intake/schema';
import { verifyMagicLink } from '@/lib/intake/magic-link';
import { eq } from 'drizzle-orm';

export type SubmitIntakeResult =
  | { ok: true }
  | { ok: false; error: 'unauthorized' | 'invalid' | 'server' | 'already-submitted' };

export async function submitIntake(formData: FormData): Promise<SubmitIntakeResult> {
  const engagementId = Number(formData.get('engagementId'));
  const token = String(formData.get('token') ?? '');
  const payloadRaw = String(formData.get('payload') ?? '');
  if (!Number.isInteger(engagementId) || engagementId <= 0) return { ok: false, error: 'invalid' };

  const check = await verifyMagicLink(engagementId, token);
  if (!check.ok) {
    return { ok: false, error: check.reason === 'already-submitted' ? 'already-submitted' : 'unauthorized' };
  }

  let parsed;
  try {
    parsed = intakeSubmissionSchema.safeParse(JSON.parse(payloadRaw));
  } catch {
    return { ok: false, error: 'invalid' };
  }
  if (!parsed.success) return { ok: false, error: 'invalid' };

  try {
    await db.transaction(async (tx) => {
      await tx.insert(intakeSubmissions).values({
        engagementId,
        toolsJson: { tools: parsed.data.tools, customTools: parsed.data.customTools ?? '' },
        credentialsVaultRef: parsed.data.credentialsVaultUrl ?? null,
        goalsText: parsed.data.goals.join('\n\n'),
        constraintsText: parsed.data.constraints ?? null,
      });
      await tx.update(engagements).set({ status: 'active' }).where(eq(engagements.id, engagementId));
    });
  } catch (err) {
    console.error('[intake] submit failed', err);
    return { ok: false, error: 'server' };
  }

  // Fire-and-forget admin notification
  notifyAdminOfIntake({ engagementId, companyName: parsed.data.companyName }).catch((e) => console.error('[intake] notify failed', e));

  return { ok: true };
}

async function notifyAdminOfIntake(params: { engagementId: number; companyName: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.RESEND_ADMIN_EMAIL;
  if (!apiKey || !from || !to) {
    console.log('[intake] admin notif skipped (env missing)', params);
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      subject: `Intake complete: ${params.companyName} (engagement #${params.engagementId})`,
      text: `${params.companyName} just submitted intake. Engagement ID: ${params.engagementId}.`,
    }),
  });
}
```

**Commit:**
```bash
git add app/onboard/[engagementId]/actions.ts
git commit -m "feat(intake): submit action transactions intake + status flip"
```

---

### Task 8: E2E happy path

**Files:**
- Create: `tests/e2e/intake-flow.spec.ts`
- Create: `tests/e2e/fixtures/seed-engagement.ts` (helper that seeds a test engagement, returns `{ id, token }`)

**Fixture strategy:**

Since the intake flow requires a valid engagement + token, the Playwright test seeds one directly via the Drizzle client before the test runs, and cleans up after. This avoids needing a running admin UI.

```ts
// fixtures/seed-engagement.ts
import { db } from '@/lib/db';
import { engagements, leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function seedTestEngagement(): Promise<{ engagementId: number; token: string; leadId: number }> {
  const [lead] = await db.insert(leads).values({
    email: `e2e-${Date.now()}@raijuu.test`,
    industry: 'saas',
    situationText: 'e2e test seed row',
  }).returning();
  const [eng] = await db.insert(engagements).values({
    leadId: lead.id,
    companyName: 'E2E Test Co',
  }).returning();
  return { engagementId: eng.id, token: eng.magicLinkToken, leadId: lead.id };
}

export async function cleanupTestEngagement(engagementId: number, leadId: number): Promise<void> {
  // intake_submissions FK is ON DELETE RESTRICT — delete child rows first if any
  await db.delete(engagements).where(eq(engagements.id, engagementId));
  await db.delete(leads).where(eq(leads.id, leadId));
}
```

**Test** (`intake-flow.spec.ts`) — happy path through 5 steps ending at success screen.

**Commit:**
```bash
git add tests/e2e/intake-flow.spec.ts tests/e2e/fixtures
git commit -m "test(e2e): intake flow happy path with seeded engagement"
```

---

### Task 9: `APP_BASE_URL` env doc + README note

Add `APP_BASE_URL=http://localhost:3000` to `.env.example` and document in README that setting this in production ensures magic-link emails point at the right domain (prevents the request-origin fallback from baking Vercel preview URLs into sent emails).

**Commit:**
```bash
git add .env.example README.md
git commit -m "docs(intake): APP_BASE_URL env var for magic link domain"
```

---

## Phase 2 Done When

- [ ] `pnpm test` green (all prior tests + 3+ magic-link + 5+ schema = ~30+)
- [ ] `pnpm test:e2e` green (5 prior + 1 intake happy path = 6)
- [ ] `pnpm build` green
- [ ] Manual: POST to `/api/admin/engagements/create-from-lead` with an admin Clerk session yields a valid magic link email
- [ ] Clicking the magic link takes you through 5 steps and flips the engagement row to `active` (verified via Drizzle Studio)
- [ ] Invalid / expired tokens show the right gate message

## What Phase 3 Will Pick Up

Phase 3 (Ops Console) adds the UI button that POSTs to `/api/admin/engagements/create-from-lead`, plus tables for leads / engagements / automations / intake submissions. The backend Phase 2 built is fully usable via curl until then.
