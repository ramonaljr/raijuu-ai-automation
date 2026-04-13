# Raijuu Dashboard — Design

**Date:** 2026-04-13
**Status:** Approved (user granted autonomy to proceed)
**Scope:** Full four-surface dashboard behind the marketing site, sequenced so every surface is *tested and ready* before any prospect or client uses it in production.

---

## 1. Context

Raijuu AI Automation is a pre-revenue done-for-you agency. The engagement model:

1. **Prospects** discover Raijuu via the marketing site.
2. They try a **gated demo** — the moment of trust-building.
3. Qualified leads **book a call** and convert.
4. Signed clients go through **onboarding/intake** to hand over their tools and goals.
5. Raijuu **builds and runs** automations on n8n (internal, invisible to clients).
6. Clients check a **portal** periodically to confirm value; Raijuu runs ops from an **ops console**.

The dashboard is the software layer of that funnel. **n8n is the automation engine — the dashboard is the sales, onboarding, operations, and reporting layer.**

**Explicit driver:** the user wants all four surfaces tested before Client #1 uses any of them in anger. Partial-readiness is unacceptable because mid-engagement surprises damage trust. Shipping skeletons of D/B/A in parallel with a polished C lets us rehearse the full funnel end-to-end with test data before the first real prospect sees it.

---

## 2. The Four Surfaces

| ID | Surface | Audience | Primary Job |
|---|---|---|---|
| C | Gated Demo | Prospects | Reduce perceived risk → book a call |
| D | Intake Flow | New clients | Capture tools, credentials, goals → hand off to build |
| B | Ops Console | Raijuu (internal) | See all clients, automation health, pipeline |
| A | Client Portal | Paying clients | Confirm their automations are running + value delivered |

**Sequencing (not scope):** C polished first, D/B/A as tested skeletons. All four reachable end-to-end before any prospect touches the demo in production.

---

## 3. Non-Goals

- Multi-tenancy at scale (single-instance, small client count assumed <20)
- Self-serve signup for clients (every engagement is hand-sold)
- Embedding n8n UI anywhere public
- Building our own workflow engine (n8n owns that)
- Mobile app (responsive web only)
- Billing/payments inside the dashboard (Stripe Checkout link from email for now)

---

## 4. Architecture

### 4.1 Stack (honor existing)

- **Framework:** Next.js 16.2.2 App Router + React 19 Server Components
- **Styling:** Tailwind 4 + existing design tokens from landing page
- **Animation:** Framer Motion (already in deps)
- **3D:** R3F **only on marketing surfaces** — not inside auth-gated views (perf + focus)
- **Auth:** Clerk (fastest to ship, good free tier) — role-based: `prospect`, `client`, `admin`
- **Database:** Postgres via Neon (serverless, branchable, good DX with Next.js)
- **ORM:** Drizzle (type-safe, small, works with Neon edge)
- **Forms:** React Server Actions + Zod validation
- **Email:** Resend (confirmations, notifications, magic links if needed)
- **Calendar:** Cal.com embed (open source, self-hostable later)
- **Rate limit / bot:** Cloudflare Turnstile on demo submit
- **Observability:** Vercel Analytics + Sentry (free tiers)

### 4.2 Route Map

```
/                          (marketing, R3F hero — existing)
/demo                      (C: gated demo — prospects)
/book                      (Cal.com embed after demo result)
/onboard/[engagementId]    (D: intake flow — signed clients, magic-link gated)
/app                       (A: client portal — auth-gated clients)
  /app/automations         (list + health)
  /app/runs                (recent runs + outcomes)
  /app/reports             (monthly delivered value)
/admin                     (B: ops console — admin role only)
  /admin/leads             (pipeline from C)
  /admin/clients           (active engagements)
  /admin/automations       (health across all clients)
  /admin/intake            (review D submissions)
```

### 4.3 Data Model (Drizzle, minimal v1)

```
leads
  id, email, industry, situation_text, demo_result_key, ip_hash,
  turnstile_verified, booked_at, source, utm_*, created_at

engagements  (one per signed client)
  id, lead_id, company_name, status (onboarding|active|paused|churned),
  magic_link_token, started_at, monthly_fee_cents

intake_submissions  (D output)
  id, engagement_id, tools_json, credentials_vault_ref,
  goals_text, constraints_text, submitted_at

automations  (what Raijuu builds per engagement)
  id, engagement_id, name, description, n8n_workflow_id,
  status (draft|live|paused|error), created_at

runs  (mirrored from n8n webhook callbacks)
  id, automation_id, started_at, finished_at, status,
  outcome_json, n8n_execution_id

outcomes_monthly  (A's core metric)
  id, engagement_id, month, runs_count, time_saved_minutes,
  dollars_influenced_cents, narrative_md
```

### 4.4 Auth & Roles

- **Anonymous:** landing, `/demo` (with email capture)
- **Magic-link (no password):** `/onboard/[engagementId]` — one-time intake, expires after submission
- **Client (Clerk):** `/app/*` — email + OTP login
- **Admin (Clerk):** `/admin/*` — role enforced via Clerk metadata

Middleware in `middleware.ts` routes by role. Drizzle row-level filtering scopes `/app/*` data to `engagement_id` of the logged-in user.

### 4.5 n8n Integration

- n8n runs on a separate host (e.g. Fly.io, Railway), private subdomain, VPN or Cloudflare Access.
- Each `automation` row points at an n8n workflow ID.
- n8n webhook on every execution POSTs to `/api/n8n/run-callback` → writes `runs` row.
- Monthly cron job aggregates `runs` → `outcomes_monthly` for A.
- **No direct n8n API calls from the browser. Ever.**

---

## 5. Surface Detail

### 5.1 C — Gated Demo (polished, conversion-ready)

**Flow:**
1. `/demo` — one input: email + industry dropdown (Turnstile invisible).
2. Situation textarea (<280 chars) + "Run analysis" button.
3. 2–3s "analyzing..." animation (sets expectation of real work).
4. Personalized result screen: 3 cards of insight pulled from `content/demos/{industry}.json` with light template substitution from their situation text.
5. Bottom CTA: Cal.com embed for a 20-min discovery call.

**Why it converts:** feels specific, takes <60s, ends with booking friction removed.

**v1.1 upgrade path:** swap templated substitution for a Claude API call that actually reads their situation and tailors 1–2 lines. Keep behind a feature flag.

### 5.2 D — Intake Flow (tested skeleton)

**Flow:** magic-link email after call booking → multi-step form:
1. Company + role confirmation (pre-filled from lead data)
2. Tool inventory (checkboxes: Gmail, Slack, HubSpot, Sheets, Airtable, Notion, Zapier, custom)
3. Credential handoff instructions (1Password share link OR Doppler invite — not stored in our DB)
4. Top 3 repetitive tasks they want automated
5. Success metric ("What does 'this worked' look like in 30 days?")
6. Submit → generates an admin notification + engagement status → `active`

**Test coverage at v1:** Playwright E2E happy path + one credential-handoff failure path.

### 5.3 B — Ops Console (tested skeleton)

**Views:**
- `/admin/leads` — table of rows from `leads`, sortable, filter by `booked_at` status. "Nudge" button sends a Resend email template.
- `/admin/clients` — engagements with health pill (green/yellow/red derived from recent `runs` error rate).
- `/admin/automations` — flat list across all clients with last-run status and link to n8n workflow.
- `/admin/intake` — pending `intake_submissions` needing review.

v1 is functional, not beautiful. No charts. Just tables + actions. Internal use only.

### 5.4 A — Client Portal (tested skeleton)

**Views:**
- `/app` — "Your automations" (list of `automations` for their engagement, status pill).
- `/app/runs` — last 30 runs with timestamp + outcome summary.
- `/app/reports` — current-month `outcomes_monthly` card: runs, time saved, dollars influenced, narrative.

v1 deliberately minimal. The portal's job isn't to wow — it's to reassure. "Yes, things are running. Yes, value is being delivered."

---

## 6. Error Handling (cross-cutting)

- All server actions wrap in try/catch, log to Sentry, return typed error to UI.
- Email delivery failures: log + continue, never block UX.
- n8n webhook callback failures: retry with exponential backoff up to 3×, then dead-letter table + admin alert.
- Missing industry demo content: fall back to `content/demos/general.json`.
- Magic link expired: route to "request new link" flow, never 500.

---

## 7. Testing Strategy

- **Unit:** Zod schemas, outcome aggregation math, template substitution.
- **Integration:** Drizzle queries against an ephemeral Neon branch per CI run.
- **E2E (Playwright):** one happy path per surface (C, D, B, A). Run headed locally, headless in CI.
- **Manual pre-flight checklist** before any prospect touches C in prod:
  - [ ] Submit demo on mobile Safari, Chrome, Firefox
  - [ ] Submit demo with every industry option
  - [ ] Book a call via Cal.com embed, confirm calendar event lands
  - [ ] Walk through D with a fake engagement ID
  - [ ] Log into B as admin, see the test lead + test engagement
  - [ ] Log into A as a test client, see test automations + runs + outcomes
  - [ ] Trigger n8n webhook against `/api/n8n/run-callback` with curl, see it in B and A

---

## 8. Phased Build Order

Each phase ends with all prior phases still green.

**Phase 0 — Foundation (week 1)**
Clerk auth, Neon + Drizzle setup, schema migrations, route guards, layout shells for `/app` and `/admin`.

**Phase 1 — C polished (week 2)**
`/demo` end-to-end with email capture, Turnstile, industry templates, Cal.com embed, Resend notifications.

**Phase 2 — D skeleton (week 3)**
`/onboard/[id]` magic-link intake, admin notification on submission.

**Phase 3 — B skeleton (week 3–4)**
`/admin/*` CRUD views for leads, clients, automations, intake review.

**Phase 4 — A skeleton (week 4–5)**
`/app/*` views, n8n webhook callback, monthly outcome aggregation cron.

**Phase 5 — End-to-end rehearsal (week 5)**
Full funnel walkthrough with test data. Fix everything that feels wrong. Only then go live.

---

## 9. Open Questions (deferred, not blocking)

- Payments: Stripe Checkout inside D, or out-of-band invoicing? (Defer to post-first-client feedback.)
- n8n self-host vs. n8n Cloud: cost crossover depends on run volume. (Start self-host on Railway, revisit at 10+ clients.)
- Claude API in C v1.1: budget cap + prompt caching. (Defer to after first 10 leads.)

---

## 10. Success Criteria

- **C:** 10 demo submissions → 2 calls booked in first 14 days after launch.
- **D:** First signed client completes intake in <15 minutes, no support ping.
- **B:** You personally can answer "is anything broken right now?" in <30 seconds.
- **A:** First client logs in, sees value, doesn't email asking "is it working?"
- **Overall:** Zero "I didn't expect that" moments during Client #1's first 30 days.
