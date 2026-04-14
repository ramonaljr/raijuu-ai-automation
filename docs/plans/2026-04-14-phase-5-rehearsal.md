# Raijuu Dashboard — Phase 5: End-to-End Rehearsal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the last two technical gaps that block a complete pre-Client-#1 funnel walkthrough (admin can't see runs; the Clerk owner account has no engagement to claim), add a daily production-smoke workflow so drift between local and Railway surfaces within 24 hours, and hand the user a concrete pre-flight checklist to drive the actual rehearsal.

**Architecture:**
- **Seed rewire.** A one-off SQL update points an existing seeded lead's `email` at the Clerk owner's email so the portal layout's email-match claim binds on first `/app` visit. Idempotent — re-running is a no-op once the claim is complete.
- **Admin runs view.** A new section on `app/admin/clients/[id]/page.tsx` lists the last 20 runs across the engagement's automations, reusing the Phase 3 `Table`, `StatusPill`, `formatters`, plus the existing `listRecentRunsForEngagement` helper from `lib/portal/data.ts` (it's engagement-scoped, works from admin too — no new data layer).
- **Production smoke.** A GitHub Actions workflow fires daily at 07:00 UTC (after the month-1 cron at 06:00 so the two don't race on the 1st), pings `/`, `/demo`, and asserts both `/api/n8n/run-callback` + `/api/cron/aggregate-monthly` return 401 without auth (proves routes exist and gates work). Manual `workflow_dispatch` lets you run it post-deploy.
- **Pre-flight runbook.** A checklist the user executes once, with specific URLs, expected behaviors, and slots to record what "feels wrong."

**Tech Stack:** Next.js 16.2.3 server components, Drizzle over Neon (no new queries — reusing `listRecentRunsForEngagement`), GitHub Actions, psql for the seed rewire. No new npm deps.

**Reference design:** `docs/plans/2026-04-13-dashboard-design.md` §7 (testing strategy + pre-flight checklist) and §10 (success criteria).

**Pre-flight rules** (carried from prior phases):
- Next 16: await `params` / `searchParams`.
- pnpm only. Never `git add .` — name every path.
- All new code reuses primitives in `app/admin/_components/`, not duplicates.

---

## Phase 5 Scope

**In:**
- `app/admin/clients/[id]/page.tsx` — add a "Recent runs" section using the existing portal data helper.
- `.github/workflows/prod-smoke.yml` — daily production smoke + manual dispatch.
- `scripts/rewire-owner-engagement.sql` — idempotent one-off seed rewire, run via `psql`.
- Execution: actually run the rewire once.
- `docs/plans/2026-04-14-phase-5-rehearsal.md` *(this file)* — pre-flight checklist at the bottom for the user to walk.
- README note pointing at the checklist.

**Out (deferred):**
- Dead-letter table for failed webhook ingestion — no observed failures, YAGNI.
- `narrative_md` editor on `/admin/clients/[id]` — narratives can be written via Drizzle Studio for the first few months; build a CMS when there's signal.
- Manual "recompute month" button on engagement detail — wait until the user hits the gap after the first cron run.
- A Playwright full-funnel E2E chaining C→D→B→A — the existing per-phase E2Es cover each surface, and a chain test has high setup cost for low marginal coverage.
- Standing up production n8n on Railway — separate infra task, design doc §9 calls it out explicitly as deferred ("revisit at 10+ clients").

---

### Task 1: Rewire owner engagement (one-off SQL + run)

**Files:**
- Create: `scripts/rewire-owner-engagement.sql`

**Why:** The admin Clerk user (`ramonvallejerajr@gmail.com`) has no engagement, so hitting `/app` routes to `/no-engagement` — which means you can't rehearse the client-portal half of the funnel from your own account. Easiest fix: point the existing seeded lead (id 46, currently `n8n-smoke-<stamp>@raijuu.test`) at your Clerk primary email. The Phase 4 claim logic then binds on first `/app` visit.

**Step 1: Implement**

`scripts/rewire-owner-engagement.sql`:

```sql
-- Idempotent: safe to re-run. Rewires the seeded lead tied to
-- engagement 44 (automation 14) to the admin Clerk user's email
-- so /app auto-claim binds on first portal visit.

-- If engagement 44 doesn't exist anymore (e.g. you reset your Neon
-- DB), this is a no-op and you'll need to re-seed — see the pre-flight
-- checklist at the bottom of docs/plans/2026-04-14-phase-5-rehearsal.md.

UPDATE leads
SET email = 'ramonvallejerajr@gmail.com'
WHERE id = (
  SELECT lead_id FROM engagements WHERE id = 44
)
AND email LIKE 'n8n-smoke-%@raijuu.test';

-- Confirm the link
SELECT
  e.id  AS engagement_id,
  e.company_name,
  e.clerk_user_id,
  l.id  AS lead_id,
  l.email
FROM engagements e
JOIN leads l ON l.id = e.lead_id
WHERE e.id = 44;
```

**Step 2: Run it**

```bash
DB=$(grep '^DATABASE_URL=' .env.local | head -1 | cut -d= -f2-)
psql "$DB" -f scripts/rewire-owner-engagement.sql
```

Expected output: one row with `email = ramonvallejerajr@gmail.com`. If `engagement_id` is empty, the engagement has been cleaned up — see the checklist below for re-seed instructions.

**Step 3: Verify**

Don't sign in yet — just confirm the DB state. The actual claim happens the first time you load `/app`, and the checklist walks you through that.

**Step 4: Commit**

```bash
git add scripts/rewire-owner-engagement.sql
git commit -m "chore(seed): rewire seeded engagement to admin email for phase 5 rehearsal"
```

---

### Task 2: Admin runs view on engagement detail

**Files:**
- Modify: `app/admin/clients/[id]/page.tsx`

**Why:** Design doc §10 defines the ops console's success as "You can answer 'is anything broken right now?' in <30 seconds." Today the engagement detail shows lead + intake but no runs — you'd have to go to Drizzle Studio to see if anything actually ran. Borrowing the existing `listRecentRunsForEngagement` helper (already built for `/app/runs` in Phase 4) keeps this a pure UI addition.

**Step 1: Modify the file**

Current `app/admin/clients/[id]/page.tsx` ends with the Intake section. Add a Recent Runs section between them (or at the end — after is fine since most-common reason to visit this page is "did it work", so runs-at-top would be nicer; but leaving the existing order preserves the natural flow lead→intake→runs).

Add these imports at the top (next to existing ones):

```tsx
import { Table, type Column } from '@/app/admin/_components/Table';
import { EmptyState } from '@/app/admin/_components/EmptyState';
import { formatRelative } from '@/app/admin/_components/formatters';
import { listRecentRunsForEngagement } from '@/lib/portal/data';
```

After the existing `const { engagement, lead, intake } = detail;` line, add:

```tsx
const recentRuns = await listRecentRunsForEngagement(engagement.id);

type RunRow = Awaited<ReturnType<typeof listRecentRunsForEngagement>>[number];

function summarizeOutcome(outcomeJson: unknown): string {
  if (!outcomeJson || typeof outcomeJson !== 'object') return '—';
  const o = outcomeJson as { summary?: unknown };
  if (typeof o.summary === 'string' && o.summary.length > 0) {
    return o.summary.length > 80 ? `${o.summary.slice(0, 80)}…` : o.summary;
  }
  return '—';
}

const runColumns: Column<RunRow>[] = [
  { header: 'Automation', cell: (r) => r.automationName },
  { header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
  { header: 'Outcome', cell: (r) => summarizeOutcome(r.outcomeJson) },
  { header: 'Started', cell: (r) => formatRelative(r.startedAt) },
];
```

Then add this section before the final `</div>` close of the outer `<div className="space-y-6">`:

```tsx
<section>
  <h2 className="text-sm font-medium mb-2">Recent runs</h2>
  <Table
    columns={runColumns}
    rows={recentRuns}
    emptyFallback={
      <EmptyState
        title="No runs yet"
        description="Runs appear here after n8n POSTs to /api/n8n/run-callback for this engagement's automations."
      />
    }
  />
</section>
```

**Note:** the runs section sits outside the border-rounded cards used for Lead/Intake because it's a table, not a key/value detail. That visual hierarchy (cards → table) matches what `/app/runs` already does.

**Step 2: Verify**

```bash
pnpm test   # no new unit tests — listRecentRunsForEngagement is integration-tested via /app/runs already
pnpm build  # must compile; this is pure RSC composition
```

**Step 3: Commit**

```bash
git add app/admin/clients/[id]/page.tsx
git commit -m "feat(admin): recent runs section on engagement detail"
```

---

### Task 3: Production smoke GitHub Actions workflow

**Files:**
- Create: `.github/workflows/prod-smoke.yml`

**Why:** You're about to hand-test a lot of surface area. A scheduled smoke check gives you a 24-hour early warning if production drifts from local (bad deploy, Clerk config change, env var rotation) before the next client touches anything. Minimal scope: prove every entry point is alive and auth-gated.

**Step 1: Implement**

```yaml
name: Production smoke

on:
  schedule:
    # 07:00 UTC daily — one hour after the monthly aggregation cron so they
    # don't race on the 1st of each month
    - cron: '0 7 * * *'
  workflow_dispatch: {}

jobs:
  smoke:
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - name: Probe production routes
        env:
          APP_PROD_URL: ${{ secrets.APP_PROD_URL }}
        run: |
          set -euo pipefail
          if [ -z "$APP_PROD_URL" ]; then
            echo "Missing APP_PROD_URL GitHub secret" >&2
            exit 1
          fi

          check() {
            local label="$1" url="$2" expected="$3" method="${4:-GET}"
            local actual
            actual=$(curl -sS -o /dev/null -w '%{http_code}' \
              --max-time 20 -X "$method" "$url" || echo "000")
            if [ "$actual" = "$expected" ]; then
              echo "OK  $label  $actual  ($url)"
            else
              echo "FAIL $label  got=$actual expected=$expected  ($url)"
              return 1
            fi
          }

          failures=0

          check 'landing'       "$APP_PROD_URL/"                                  200          || failures=$((failures+1))
          check 'demo'          "$APP_PROD_URL/demo"                              200          || failures=$((failures+1))
          check 'admin-gated'   "$APP_PROD_URL/admin"                             307          || failures=$((failures+1))
          check 'app-gated'     "$APP_PROD_URL/app"                               307          || failures=$((failures+1))
          check 'n8n-webhook'   "$APP_PROD_URL/api/n8n/run-callback"              401 POST     || failures=$((failures+1))
          check 'cron-route'    "$APP_PROD_URL/api/cron/aggregate-monthly"       401          || failures=$((failures+1))

          if [ "$failures" -gt 0 ]; then
            echo "" >&2
            echo "$failures smoke check(s) failed" >&2
            exit 1
          fi
          echo ""
          echo "All smoke checks passed."
```

**Notes:**
- Reuses the existing `APP_PROD_URL` secret (set earlier for the monthly cron workflow). No new secrets.
- Uses 307 (Next's `redirect()` default) for auth-gated pages because that's what the `/admin` and `/app` layouts return when signed out.
- Doesn't test the demo form submission — that would spam the `leads` table. The `/demo` landing 200 is enough to catch build/deploy failures.
- No Clerk flow — we can't test OAuth from CI without test tokens, and the 307 redirect already proves the guard exists.

**Step 2: Verify (manual trigger)**

After pushing, trigger via `gh workflow run prod-smoke.yml`. Inspect `gh run view --log` for "All smoke checks passed."

**Step 3: Commit**

```bash
git add .github/workflows/prod-smoke.yml
git commit -m "ci(smoke): daily production smoke check against railway"
```

---

### Task 4: Pre-flight checklist in README pointer

**Files:**
- Modify: `README.md`

**Why:** A pre-flight checklist the owner runs once (per design doc §7). The checklist itself lives at the bottom of this plan file so it's version-controlled and editable; README points at it.

**Step 1: Add a pointer line to README**

Append near the `## Architecture` section:

```markdown
### Rehearsal

Before Client #1 touches production, walk through `docs/plans/2026-04-14-phase-5-rehearsal.md` (the "Pre-flight checklist" section at the bottom). It steps you through the full funnel against test data and flags what to watch for.
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: point README at phase 5 rehearsal checklist"
```

---

### Task 5: Run the rewire + push everything

**Steps:**

1. Apply the rewire SQL locally:
   ```bash
   DB=$(grep '^DATABASE_URL=' .env.local | head -1 | cut -d= -f2-)
   psql "$DB" -f scripts/rewire-owner-engagement.sql
   ```
2. `pnpm test` — should remain at 77/77 (no new unit tests).
3. `pnpm test:e2e` — should remain at 14/14 (no new e2e; the admin runs section has no signed-out test because the route redirects, already covered by `auth-gates.spec.ts`).
4. `pnpm build` — green.
5. `git push origin main` — triggers Railway redeploy. Both cron workflows start firing on their schedules.
6. `gh workflow run prod-smoke.yml` — manually trigger the new smoke check. Confirm all-green.

---

## Phase 5 Done When

- [ ] `pnpm test` green
- [ ] `pnpm test:e2e` green
- [ ] `pnpm build` green
- [ ] `psql` confirms lead 46 email = your Clerk email AND engagement 44 has a non-null `clerk_user_id` after your first `/app` visit
- [ ] The prod-smoke workflow's first manual run reports "All smoke checks passed"
- [ ] You've walked the full pre-flight checklist (below) and flagged anything that surprised you

---

## Pre-flight checklist (walk this once, record notes in-line)

**Prereqs (should all be ✅ from prior phases):**
- [x] Signed up in Clerk as `ramonvallejerajr@gmail.com`, `publicMetadata.role = admin`
- [x] Railway deployment live at `https://raijuu-ai-automation-production.up.railway.app`
- [x] n8n running locally via Docker on `http://localhost:5679` with Raijuu test workflow active
- [ ] After Task 1 runs: lead 46 email = `ramonvallejerajr@gmail.com`, engagement 44 still exists
- [ ] After push: GH Actions `prod-smoke.yml` manual run is green

### Funnel walk — production (Railway)

Sign into production at `https://raijuu-ai-automation-production.up.railway.app/sign-in` with your admin account. Sign out and back in once so your JWT has the `role=admin` claim.

**Marketing landing + navbar**
- [ ] `https://raijuu-ai-automation-production.up.railway.app/` loads, "Sign in" and "Work with Us" both visible when signed out
- [ ] When signed in, "Portal" link + UserButton appear instead of Sign in

**Gated demo (surface C)**
- [ ] `/demo` renders the multi-step demo form
- [ ] Submit one demo with industry = `saas`, situation text ~80 chars
- [ ] See personalized result screen, then book-a-call CTA (may show "not configured" — fine, Cal.com is optional per Phase 1)
- [ ] Admin notification email lands in `ramonvallejerajr@gmail.com` (unless Resend rate-limited)
- [ ] After submission: `/admin/leads` shows your new lead at the top

**Intake (surface D)**
- [ ] On `/admin/leads`, click "Convert to client" on the lead you just made, give it a company name (e.g. "Pre-flight Test Co")
- [ ] Modal returns an engagement id + magic link URL (and sends the magic link email via Resend)
- [ ] Open the magic link in a private browser window (not signed-in)
- [ ] Walk all 5 intake steps with plausible data
- [ ] Submit — success screen appears
- [ ] Back in `/admin/intake`, the submission appears at the top; detail page shows your tools/goals correctly

**Ops console (surface B)**
- [ ] `/admin` tiles show Leads / Clients / Automations / Intake submissions counts (≥1 each after the above steps)
- [ ] `/admin/clients` lists engagement 44 ("n8n Smoke Co") with the status pill
- [ ] `/admin/clients/44` shows lead + (no intake for 44 — that's fine, 44 was seeded without one)
- [ ] **New (Task 2):** "Recent runs" section on `/admin/clients/44` shows runs 27 and 28 from automation 14 with summary "Triaged 8 emails; replied to 3, archived 5."
- [ ] `/admin/automations` shows "Daily Inbox Triage" (id 14, engagement "n8n Smoke Co")

**Client portal (surface A)**
- [ ] Visit `/app` in the production app while signed in as `ramonvallejerajr@gmail.com`
- [ ] First-time auto-claim: the layout binds your Clerk user to engagement 44
- [ ] Page shows "n8n Smoke Co" header, "Daily Inbox Triage" automation row
- [ ] `/app/runs` shows runs 27 and 28
- [ ] `/app/reports` shows "This month's report computes on the 1st" (no outcomes row for current month yet)
- [ ] Refresh `/admin/clients/44` — `clerk_user_id` now populated (confirm via Drizzle Studio or `psql`)

**n8n end-to-end (against production webhook)**
- [ ] In local n8n UI (`http://localhost:5679`), open "Raijuu — Inbox Triage (test run)"
- [ ] Click "Execute workflow" once manually
- [ ] Refresh `/app/runs` — a new run appears within seconds
- [ ] Refresh `/admin/clients/44` Recent runs section — same new row appears

**Monthly aggregation**
- [ ] Manually trigger `gh workflow run cron-monthly.yml`
- [ ] `gh run view <id> --log` shows `{"ok":true,"month":"<last month>","upserts":N}`
- [ ] If the current month has runs (27 and 28 both have `started_at = 2026-04-14`), they won't aggregate until next month's 1st. To test aggregation end-to-end right now, temporarily insert a run with `started_at` in the previous month via psql, re-run the cron, see the outcome row appear in `/app/reports`, then delete it.

### Known pre-Client-#1 gaps

These are intentional per Phase 4/5 deferrals. Record here if any become blocking during the walk:

- No `outcomes_monthly.narrative_md` editor — must hand-edit via Drizzle Studio for v1.
- No dead-letter table for webhook failures — relying on n8n retry + unique index for idempotency.
- No admin re-aggregate button — wait for the cron, or curl the route.
- Production n8n not hosted yet (local Docker only).

### Things to flag

Use this section to write down anything that "felt wrong" during the walk:

- [ ] _(add notes here)_

---

## What comes after Phase 5

Nothing in the original roadmap. After the walk, decide what's blocking Client #1:

1. **If something broke during the walk** — fix it, re-walk, iterate.
2. **If the walk felt fine** — stand up production n8n (separate Railway service), tie it to the production webhook, sign Client #1, watch the funnel do its thing.
3. **If a deferred gap bit** — build whichever of `{narrative_md editor, dead-letter table, manual re-aggregate button, outcomes picker for multi-engagement clients}` the gap demands. None sooner.
