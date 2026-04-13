# Raijuu Dashboard — Phase 1: Gated Demo Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship `/demo` — a 60-second gated experience where a prospect enters their email + industry + situation, sees a convincing personalized "analysis" (canned content with light template substitution), and lands on a Cal.com booking CTA. Conversion asset #1.

**Architecture:** Client-side multi-step form with React Server Actions for lead capture. Industry-specific content lives as static JSON in `content/demos/`. Template substitution is pure (no LLM calls in v1 — keep it fast, deterministic, free). Cal.com embed handles booking. Resend and Cloudflare Turnstile are optional (gated on env vars) so dev works without credentials.

**Tech Stack:** Next.js 16.2.3 App Router, React 19, Tailwind 4, Framer Motion (already installed), Drizzle (for `leads` writes), Zod 4 (validation), Resend (optional), Cloudflare Turnstile (optional), Cal.com embed.

**Reference design:** `docs/plans/2026-04-13-dashboard-design.md` §5.1.

**Pre-flight rules (from `docs/plans/2026-04-14-phase-0-foundation.md`):**
- Next.js 16: read `node_modules/next/dist/docs/` before writing server actions or middleware.
- Zod v4 gotchas: `z.record(z.string(), V)`, `z.treeifyError`, `.strict()` semantics.
- Clerk v7: not relevant for Phase 1 (demo is public/anonymous).
- pnpm only.

---

## Phase 1 Scope

In:
- `/demo` multi-step flow (email → industry → situation → analyzing → result → book)
- 6 industry content JSON files + 1 `general.json` fallback
- `submitDemo()` server action → writes to `leads` table
- Cal.com booking embed on result screen
- Optional Turnstile bot check (runtime-gated on env)
- Optional Resend admin notification on each submission (runtime-gated on env)
- In-memory rate limit (3 demos / IP / hour)
- 1 Playwright happy-path E2E

Out (deferred):
- LLM-powered personalization (v1.1 feature flag)
- A/B test harness for copy
- Multi-language demo
- Analytics wiring (just `console.log` for now)

---

## External Services (user-managed, optional at dev time)

| Service | Free tier | Why | Blocking? |
|---|---|---|---|
| Cal.com | Yes | Booking CTA | Public username only — no API key; set `NEXT_PUBLIC_CAL_USERNAME` in `.env.local` |
| Resend | Yes (3k/mo) | Admin notification email | No — server action skips send if `RESEND_API_KEY` unset |
| Cloudflare Turnstile | Yes (unlimited) | Bot check | No — form submits without Turnstile if keys unset |

Add these env vars to `.env.example` and `.env.local` when Task 13 ships:
```
NEXT_PUBLIC_CAL_USERNAME=
RESEND_API_KEY=
RESEND_FROM=
RESEND_ADMIN_EMAIL=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

---

### Task 1: Industry content JSON templates

**Files:**
- Create: `content/demos/general.json`
- Create: `content/demos/real-estate.json`
- Create: `content/demos/ecommerce.json`
- Create: `content/demos/saas.json`
- Create: `content/demos/agency.json`
- Create: `content/demos/healthcare.json`
- Create: `content/demos/professional-services.json`

**Shape (all files):**

```json
{
  "industry": "real-estate",
  "displayName": "Real Estate",
  "cards": [
    {
      "title": "Lead Triage Automation",
      "body": "For an agent handling {{situationDetail}}, Raijuu's lead-scoring pipeline filters inbound inquiries by intent signals (listing views, property type matches, budget range), routes hot leads to your phone within 90 seconds, and drops cold leads into a 6-week nurture sequence. Typical outcome: 3–5× faster hot-lead response, 40% recovery rate on previously-ignored leads.",
      "metric": "+38% close rate in first 60 days"
    },
    { "title": "...", "body": "...", "metric": "..." },
    { "title": "...", "body": "...", "metric": "..." }
  ],
  "ctaLine": "We'd build this in 2–3 weeks for a real-estate operator. Want to see exactly how?"
}
```

**Placeholders supported in `body`:**
- `{{situationDetail}}` — substituted with the prospect's situation textarea (truncated to 120 chars, HTML-escaped)
- `{{industry}}` — displayName

Use realistic, specific numbers (anchored in plausibility). Don't use hedging language ("can help", "might"). Copy should feel like it was written by someone who's actually done this work 10 times.

**Step 1: Write general.json first** (the fallback). Three generic cards about: (a) manual-work triage, (b) cross-tool sync, (c) monthly reporting automation.

**Step 2: Write the 6 industry files.** Each with three distinct cards relevant to that vertical.

**Step 3: Add a TypeScript type for the shape**: `lib/demo/content.ts`

```ts
import { z } from 'zod';

export const demoCardSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  metric: z.string().min(1),
});

export const demoContentSchema = z.object({
  industry: z.string(),
  displayName: z.string(),
  cards: z.array(demoCardSchema).length(3),
  ctaLine: z.string(),
});

export type DemoContent = z.infer<typeof demoContentSchema>;
export type DemoCard = z.infer<typeof demoCardSchema>;

export const SUPPORTED_INDUSTRIES = [
  'general',
  'real-estate',
  'ecommerce',
  'saas',
  'agency',
  'healthcare',
  'professional-services',
] as const;

export type Industry = typeof SUPPORTED_INDUSTRIES[number];
```

**Step 4: Test — validate every JSON file parses against the schema**

Create `lib/demo/content.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { demoContentSchema, SUPPORTED_INDUSTRIES } from './content';

describe('demo content', () => {
  for (const industry of SUPPORTED_INDUSTRIES) {
    it(`${industry}.json matches the schema`, () => {
      const path = join(process.cwd(), 'content/demos', `${industry}.json`);
      const raw = JSON.parse(readFileSync(path, 'utf8'));
      const parsed = demoContentSchema.parse(raw);
      expect(parsed.cards).toHaveLength(3);
      expect(parsed.industry).toBe(industry);
    });
  }
});
```

Run: `pnpm vitest run lib/demo/content.test.ts` → 7 passing.

**Step 5: Commit**

```bash
git add content/demos lib/demo
git commit -m "feat(demo): industry content templates + zod schema"
```

---

### Task 2: Lead submission Zod schema + helpers

**Files:**
- Create: `lib/demo/submission.ts`
- Create: `lib/demo/submission.test.ts`

**Step 1: Schema**

```ts
import { z } from 'zod';
import { SUPPORTED_INDUSTRIES } from './content';

export const demoSubmissionSchema = z.object({
  email: z.string().email().max(254),
  industry: z.enum(SUPPORTED_INDUSTRIES),
  situationText: z.string().min(10).max(280),
  turnstileToken: z.string().optional(),
});

export type DemoSubmission = z.infer<typeof demoSubmissionSchema>;

export function substituteTemplate(body: string, situation: string, industryDisplay: string): string {
  const safeSituation = situation
    .slice(0, 120)
    .replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!));
  return body
    .replaceAll('{{situationDetail}}', safeSituation)
    .replaceAll('{{industry}}', industryDisplay);
}
```

**Step 2: Tests**

```ts
import { describe, it, expect } from 'vitest';
import { demoSubmissionSchema, substituteTemplate } from './submission';

describe('demoSubmissionSchema', () => {
  it('accepts a valid submission', () => {
    const ok = demoSubmissionSchema.parse({
      email: 'a@b.co',
      industry: 'saas',
      situationText: 'We get 40 support tickets a day and my team is drowning.',
    });
    expect(ok.email).toBe('a@b.co');
  });
  it('rejects bad email', () => {
    expect(() => demoSubmissionSchema.parse({ email: 'not-email', industry: 'saas', situationText: 'x'.repeat(50) })).toThrow();
  });
  it('rejects unknown industry', () => {
    expect(() => demoSubmissionSchema.parse({ email: 'a@b.co', industry: 'aerospace', situationText: 'x'.repeat(50) })).toThrow();
  });
  it('rejects short situation', () => {
    expect(() => demoSubmissionSchema.parse({ email: 'a@b.co', industry: 'saas', situationText: 'short' })).toThrow();
  });
});

describe('substituteTemplate', () => {
  it('substitutes situationDetail', () => {
    expect(substituteTemplate('You said: {{situationDetail}}.', 'too many leads', 'SaaS')).toBe('You said: too many leads.');
  });
  it('escapes HTML in situation', () => {
    expect(substituteTemplate('Said: {{situationDetail}}', '<script>x</script>', 'SaaS')).toContain('&lt;script&gt;');
  });
  it('truncates long situations to 120 chars', () => {
    const long = 'x'.repeat(200);
    const result = substituteTemplate('{{situationDetail}}', long, 'SaaS');
    expect(result.length).toBeLessThanOrEqual(120 + 10); // small slack for HTML escape
  });
  it('substitutes industry', () => {
    expect(substituteTemplate('{{industry}} teams', 'x'.repeat(50), 'E-commerce')).toBe('E-commerce teams');
  });
});
```

Run: `pnpm vitest run lib/demo/submission.test.ts` → 8 passing.

**Step 3: Commit**

```bash
git add lib/demo/submission.ts lib/demo/submission.test.ts
git commit -m "feat(demo): submission schema + safe template substitution"
```

---

### Task 3: Rate limiter

**Files:**
- Create: `lib/demo/rate-limit.ts`
- Create: `lib/demo/rate-limit.test.ts`

In-memory sliding window — good enough for dev and low-traffic first 30 days. Upstash Redis upgrade path when traffic demands.

**Step 1: Implementation**

```ts
const buckets = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3;

export function checkRateLimit(ipHash: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const hits = (buckets.get(ipHash) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_REQUESTS) {
    buckets.set(ipHash, hits);
    return { ok: false, remaining: 0 };
  }
  hits.push(now);
  buckets.set(ipHash, hits);
  return { ok: true, remaining: MAX_REQUESTS - hits.length };
}

// Test-only
export function _reset() {
  buckets.clear();
}

export async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip + (process.env.IP_HASH_SALT ?? 'raijuu-default-salt'));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
```

**Step 2: Tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, hashIp, _reset } from './rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => _reset());
  it('allows first 3 hits', () => {
    expect(checkRateLimit('ip1').ok).toBe(true);
    expect(checkRateLimit('ip1').ok).toBe(true);
    expect(checkRateLimit('ip1').ok).toBe(true);
  });
  it('blocks 4th hit', () => {
    checkRateLimit('ip2'); checkRateLimit('ip2'); checkRateLimit('ip2');
    expect(checkRateLimit('ip2').ok).toBe(false);
  });
  it('isolates per-ip', () => {
    checkRateLimit('a'); checkRateLimit('a'); checkRateLimit('a');
    expect(checkRateLimit('b').ok).toBe(true);
  });
});

describe('hashIp', () => {
  it('returns 16-char hex', async () => {
    const h = await hashIp('127.0.0.1');
    expect(h).toMatch(/^[0-9a-f]{16}$/);
  });
  it('is deterministic', async () => {
    expect(await hashIp('1.2.3.4')).toBe(await hashIp('1.2.3.4'));
  });
  it('differs per ip', async () => {
    expect(await hashIp('1.2.3.4')).not.toBe(await hashIp('5.6.7.8'));
  });
});
```

Run: `pnpm vitest run lib/demo/rate-limit.test.ts` → 6 passing.

**Step 3: Commit**

```bash
git add lib/demo/rate-limit.ts lib/demo/rate-limit.test.ts
git commit -m "feat(demo): in-memory rate limiter + IP hashing"
```

---

### Task 4: Turnstile + Resend helpers (env-gated)

**Files:**
- Create: `lib/demo/turnstile.ts`
- Create: `lib/demo/resend.ts`

Both helpers short-circuit to a safe no-op when env vars are missing, so local dev works without third-party accounts.

**Step 1: `lib/demo/turnstile.ts`**

```ts
export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Dev mode: accept all
  if (!token) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
```

**Step 2: `lib/demo/resend.ts`**

```ts
type AdminNotification = {
  email: string;
  industry: string;
  situationText: string;
};

export async function notifyAdminOfLead(submission: AdminNotification): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.RESEND_ADMIN_EMAIL;
  if (!apiKey || !from || !to) {
    console.log('[resend] skipped (env not set):', submission.email);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      subject: `New Raijuu demo lead: ${submission.email}`,
      text: `Industry: ${submission.industry}\n\nSituation:\n${submission.situationText}`,
    }),
  });
  if (!res.ok) {
    console.error('[resend] failed', res.status, await res.text());
    // Don't throw — lead is already saved; email is best-effort.
  }
}
```

**Step 3: Commit** (no tests — these are thin integration wrappers; coverage comes via the server action test in Task 5)

```bash
git add lib/demo/turnstile.ts lib/demo/resend.ts
git commit -m "feat(demo): turnstile + resend helpers (env-gated)"
```

---

### Task 5: Server action — `submitDemo`

**Files:**
- Create: `app/demo/actions.ts`

**Step 1: Implementation**

```ts
'use server';

import { randomUUID } from 'node:crypto';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { demoSubmissionSchema } from '@/lib/demo/submission';
import { checkRateLimit, hashIp } from '@/lib/demo/rate-limit';
import { verifyTurnstile } from '@/lib/demo/turnstile';
import { notifyAdminOfLead } from '@/lib/demo/resend';

export type SubmitDemoResult =
  | { ok: true; resultKey: string; industry: string }
  | { ok: false; error: 'rate-limited' | 'bot' | 'invalid' | 'server' };

export async function submitDemo(formData: FormData): Promise<SubmitDemoResult> {
  const raw = {
    email: String(formData.get('email') ?? ''),
    industry: String(formData.get('industry') ?? ''),
    situationText: String(formData.get('situationText') ?? ''),
    turnstileToken: formData.get('turnstileToken') ? String(formData.get('turnstileToken')) : undefined,
  };
  const parsed = demoSubmissionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? '0.0.0.0';
  const ipH = await hashIp(ip);
  const rl = checkRateLimit(ipH);
  if (!rl.ok) return { ok: false, error: 'rate-limited' };

  const turnstileOk = await verifyTurnstile(parsed.data.turnstileToken);
  if (!turnstileOk) return { ok: false, error: 'bot' };

  const resultKey = randomUUID();

  try {
    await db.insert(leads).values({
      email: parsed.data.email,
      industry: parsed.data.industry,
      situationText: parsed.data.situationText,
      demoResultKey: resultKey,
      ipHash: ipH,
      turnstileVerified: Boolean(parsed.data.turnstileToken),
      source: 'demo',
    });
  } catch (err) {
    console.error('[demo] insert failed', err);
    return { ok: false, error: 'server' };
  }

  // Fire-and-forget admin notification
  notifyAdminOfLead({
    email: parsed.data.email,
    industry: parsed.data.industry,
    situationText: parsed.data.situationText,
  }).catch((e) => console.error('[demo] notify failed', e));

  return { ok: true, resultKey, industry: parsed.data.industry };
}
```

**Step 2: Verify build**

Run: `pnpm build` → green. No runtime test here (integration test comes in Task 10 via Playwright E2E).

**Step 3: Commit**

```bash
git add app/demo/actions.ts
git commit -m "feat(demo): submitDemo server action with rate-limit + turnstile + notify"
```

---

### Task 6: Demo page shell + multi-step client component

**Files:**
- Create: `app/demo/page.tsx`
- Create: `app/demo/DemoFlow.tsx`

**Step 1: Route page** (`app/demo/page.tsx`) — renders the client flow inside a branded container.

```tsx
import { DemoFlow } from './DemoFlow';

export const metadata = {
  title: 'See Raijuu in Action | 60-second Analysis',
  description: 'Tell us your situation. We\'ll show you exactly what Raijuu would automate.',
};

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center py-16 px-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">See Raijuu in Action</h1>
        <p className="text-neutral-400 mb-10">Tell us your situation. In 60 seconds, we'll show you exactly what we'd automate and what it'd be worth.</p>
        <DemoFlow />
      </div>
    </main>
  );
}
```

(Colors match the landing-page brand. Adapt if the landing page uses a different palette — check `app/page.tsx` and `globals.css` and align.)

**Step 2: Client flow component** (`app/demo/DemoFlow.tsx`)

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitDemo, type SubmitDemoResult } from './actions';
import { SUPPORTED_INDUSTRIES, type Industry } from '@/lib/demo/content';

type Step = 'form' | 'analyzing' | 'result' | 'error';

export function DemoFlow() {
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState<Industry>('general');
  const [situationText, setSituationText] = useState('');
  const [result, setResult] = useState<SubmitDemoResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep('analyzing');
    const fd = new FormData();
    fd.set('email', email);
    fd.set('industry', industry);
    fd.set('situationText', situationText);
    // Turnstile token populated later if enabled
    const r = await submitDemo(fd);
    setResult(r);
    // Artificial delay so the "analyzing" animation always plays for at least 2s
    await new Promise((res) => setTimeout(res, 2000));
    setStep(r.ok ? 'result' : 'error');
  }

  return (
    <AnimatePresence mode="wait">
      {step === 'form' && (
        <motion.form
          key="form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          <label className="block">
            <span className="block text-sm text-neutral-400 mb-1">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 focus:border-white outline-none"
              placeholder="you@company.com"
            />
          </label>
          <label className="block">
            <span className="block text-sm text-neutral-400 mb-1">Industry</span>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value as Industry)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 focus:border-white outline-none"
            >
              {SUPPORTED_INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm text-neutral-400 mb-1">What's chewing up your team's time? ({situationText.length}/280)</span>
            <textarea
              required
              minLength={10}
              maxLength={280}
              value={situationText}
              onChange={(e) => setSituationText(e.target.value)}
              rows={4}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 focus:border-white outline-none"
              placeholder="e.g. My team manually pastes Shopify order data into Airtable every day..."
            />
          </label>
          <button
            type="submit"
            disabled={situationText.length < 10}
            className="w-full bg-white text-black font-semibold py-3 rounded disabled:opacity-50"
          >
            Run analysis
          </button>
        </motion.form>
      )}

      {step === 'analyzing' && (
        <motion.div
          key="analyzing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <div className="w-12 h-12 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
          <p className="text-neutral-400">Analyzing your situation…</p>
        </motion.div>
      )}

      {step === 'result' && result?.ok && (
        <DemoResult
          key="result"
          industry={result.industry}
          situationText={situationText}
        />
      )}

      {step === 'error' && result && !result.ok && (
        <DemoError key="error" error={result.error} onRetry={() => setStep('form')} />
      )}
    </AnimatePresence>
  );
}

function DemoError({ error, onRetry }: { error: string; onRetry: () => void }) {
  const messages: Record<string, string> = {
    'rate-limited': 'You\'ve tried the demo 3 times in the last hour. Give it a bit and come back.',
    'bot': 'Our bot check didn\'t like that. Refresh and try once more.',
    'invalid': 'Something in the form looked off. Double-check email + situation.',
    'server': 'Our side coughed. Try again in a moment.',
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
      <p className="text-xl mb-4">Couldn't run that analysis.</p>
      <p className="text-neutral-400 mb-8">{messages[error] ?? 'Unknown error.'}</p>
      <button onClick={onRetry} className="bg-white text-black px-6 py-2 rounded">Try again</button>
    </motion.div>
  );
}

// DemoResult will be filled in Task 7
function DemoResult(_props: { industry: string; situationText: string }) {
  return <div>result placeholder</div>;
}
```

**Step 3: Verify build**

Run: `pnpm build` → green. Route `/demo` should now appear in the build output as a static page.

**Step 4: Commit**

```bash
git add app/demo/page.tsx app/demo/DemoFlow.tsx
git commit -m "feat(demo): /demo route + multi-step client flow"
```

---

### Task 7: Result renderer + Cal.com embed

**Files:**
- Create: `app/demo/DemoResult.tsx`
- Modify: `app/demo/DemoFlow.tsx` — import and use the real DemoResult

**Step 1: `DemoResult.tsx`**

Fetch the matching industry JSON, substitute templates, render three cards, show Cal.com embed.

```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { substituteTemplate } from '@/lib/demo/submission';
import { type DemoContent } from '@/lib/demo/content';

export function DemoResult({ industry, situationText }: { industry: string; situationText: string }) {
  const [content, setContent] = useState<DemoContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await import(`@/content/demos/${industry}.json`);
        if (!cancelled) setContent(data.default as DemoContent);
      } catch {
        const fallback = await import('@/content/demos/general.json');
        if (!cancelled) setContent(fallback.default as DemoContent);
      }
    })();
    return () => { cancelled = true; };
  }, [industry]);

  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div>
        <p className="text-sm text-neutral-500 uppercase tracking-widest mb-1">Analysis complete</p>
        <h2 className="text-2xl font-semibold">Here's what Raijuu would build for a {content.displayName} operator like you.</h2>
      </div>

      <div className="space-y-4">
        {content.cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 + 0.2 }}
            className="border border-neutral-800 bg-neutral-950 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{card.title}</h3>
              <span className="text-xs text-emerald-400 border border-emerald-900 bg-emerald-950 px-2 py-0.5 rounded">
                {card.metric}
              </span>
            </div>
            <p
              className="text-sm text-neutral-400 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: substituteTemplate(card.body, situationText, content.displayName),
              }}
            />
          </motion.div>
        ))}
      </div>

      <div className="border-t border-neutral-800 pt-10">
        <p className="text-lg mb-4">{content.ctaLine}</p>
        <CalBooking />
      </div>
    </motion.div>
  );
}

function CalBooking() {
  const username = process.env.NEXT_PUBLIC_CAL_USERNAME;
  if (!username) {
    return (
      <div className="border border-yellow-900 bg-yellow-950/30 rounded p-4 text-sm text-yellow-200">
        Booking not configured yet (set <code>NEXT_PUBLIC_CAL_USERNAME</code> in env).
      </div>
    );
  }
  return (
    <a
      href={`https://cal.com/${username}/30min?overlayCalendar=true`}
      target="_blank"
      rel="noreferrer"
      className="inline-block bg-white text-black font-semibold px-6 py-3 rounded hover:bg-neutral-100 transition-colors"
    >
      Book a 30-minute call →
    </a>
  );
}
```

(v1 uses a link-out to Cal.com instead of the in-page embed. Simpler, no script-loading side-effects, and Cal.com has a good hosted booking UX. Upgrade to `<Cal />` embed component later if conversion data warrants.)

**Step 2: Replace the placeholder in `DemoFlow.tsx`**

```tsx
// Replace the bottom of the file:
// function DemoResult(_props: ...) { return <div>result placeholder</div>; }
// With:
import { DemoResult } from './DemoResult';
```

(And remove the placeholder function.)

**Step 3: Verify build**

Run: `pnpm build` → green. `/demo` still static.

**Step 4: Commit**

```bash
git add app/demo/DemoResult.tsx app/demo/DemoFlow.tsx
git commit -m "feat(demo): personalized result cards + Cal.com CTA"
```

---

### Task 8: Turnstile widget integration (client-side, env-gated)

**Files:**
- Modify: `app/demo/DemoFlow.tsx` — inject Turnstile widget when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set

**Step 1: Client-side widget**

Inside `DemoFlow`, conditionally render the Turnstile widget just above the submit button:

```tsx
{process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
  <>
    <div
      className="cf-turnstile"
      data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      data-callback="onTurnstileCallback"
    />
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
  </>
)}
```

Wire a hidden `turnstileToken` field and a global `onTurnstileCallback` that `setState`s it. Details:

```tsx
// At the top of DemoFlow:
const [turnstileToken, setTurnstileToken] = useState('');

useEffect(() => {
  (window as any).onTurnstileCallback = (token: string) => setTurnstileToken(token);
  return () => { delete (window as any).onTurnstileCallback; };
}, []);

// In handleSubmit, add:
fd.set('turnstileToken', turnstileToken);
```

If no site key is set, Turnstile is skipped and `submitDemo` accepts (via `verifyTurnstile` short-circuit).

**Step 2: Verify build**

`pnpm build` → green.

**Step 3: Commit**

```bash
git add app/demo/DemoFlow.tsx
git commit -m "feat(demo): optional turnstile widget (env-gated)"
```

---

### Task 9: Link demo from landing page

**Files:**
- Modify: `app/page.tsx` (or whichever component has the primary hero CTA)

Identify the primary hero CTA button on the landing page and point it at `/demo`. Preserve all existing styling. If multiple CTAs exist, update the "See Raijuu in action" / "Try the demo" / "Get started" button — use judgment based on current copy.

**Step 1: Read `app/page.tsx` + relevant components** to find the CTA.

**Step 2: Update the link target.**

**Step 3: Commit**

```bash
git add app/page.tsx components/<whatever>.tsx
git commit -m "feat(marketing): link landing page CTA to /demo"
```

---

### Task 10: E2E happy path

**Files:**
- Create: `tests/e2e/demo-flow.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('happy path: submit demo and land on result screen', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: /see raijuu in action/i })).toBeVisible();

  await page.fill('input[type=email]', `test-${Date.now()}@raijuu.test`);
  await page.selectOption('select', 'saas');
  await page.fill('textarea', 'We get 80 support tickets a day and spend half of Monday just categorizing them. It is slow.');
  await page.getByRole('button', { name: /run analysis/i }).click();

  await expect(page.getByText(/analyzing your situation/i)).toBeVisible();
  await expect(page.getByText(/analysis complete/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(3);
});

test('rejects obviously invalid email client-side', async ({ page }) => {
  await page.goto('/demo');
  await page.fill('input[type=email]', 'not-an-email');
  await page.fill('textarea', 'Some real situation text that is long enough to pass the minimum character check here.');
  await page.getByRole('button', { name: /run analysis/i }).click();
  // Native HTML validation keeps the form on screen
  await expect(page.getByRole('heading', { name: /see raijuu in action/i })).toBeVisible();
});
```

**Step 1: Run**

`pnpm test:e2e` → 2 new + 3 existing = 5 passing.

**Step 2: Clean up Playwright artifacts**

```bash
rm -rf test-results playwright-report
```

**Step 3: Commit**

```bash
git add tests/e2e/demo-flow.spec.ts
git commit -m "test(e2e): demo flow happy path + invalid email guard"
```

---

### Task 11: Env var documentation

**Files:**
- Modify: `.env.example` — add the 6 new Phase 1 vars
- Modify: `README.md` — document which services are optional and where to get keys

```
# Cal.com (public username for booking CTA)
NEXT_PUBLIC_CAL_USERNAME=

# Resend (admin notification email on each demo submission)
RESEND_API_KEY=
RESEND_FROM=
RESEND_ADMIN_EMAIL=

# Cloudflare Turnstile (bot check on demo form)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# IP hashing salt (change in prod for privacy)
IP_HASH_SALT=
```

**Step 1: Update `.env.example`** (targeted `git add .env.example` — do NOT touch `.env.local`).

**Step 2: Update `README.md`** Local Development section to list the new vars and note all three services are optional at dev time.

**Step 3: Commit**

```bash
git add .env.example README.md
git commit -m "docs: Phase 1 optional env vars (cal / resend / turnstile)"
```

---

## Phase 1 Done When

- [ ] `pnpm test` passes (5 existing + 3 new test files = lots of tests)
- [ ] `pnpm test:e2e` passes (5 total)
- [ ] `pnpm build` green
- [ ] `/demo` renders with no console errors (manual verification needed)
- [ ] Filling the form and submitting writes a row to `leads` (check via `pnpm db:studio`)
- [ ] All 7 industry JSON files render without "undefined" in any card
- [ ] Cal.com CTA is either a working link (when `NEXT_PUBLIC_CAL_USERNAME` is set) or a clear "not configured" notice
- [ ] Without Turnstile/Resend env vars set, everything still works (graceful degradation)
- [ ] No Playwright artifacts in working tree

## What Phase 2 Will Pick Up

Phase 2 (Intake Flow) builds on the `engagements` table seeded by converting leads. When you mark a lead as "booked", a magic-link email (via Resend, now available from Phase 1 setup) sends them to `/onboard/[engagementId]` for tool/credential capture.
