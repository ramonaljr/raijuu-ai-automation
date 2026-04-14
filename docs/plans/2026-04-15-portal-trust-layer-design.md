# Portal Trust Layer — Design

**Date:** 2026-04-15
**Status:** Approved (autonomous mode)
**Scope:** Three P0 client-portal improvements that close the trust-and-time-to-value gap before Client #1.

---

## 1. Why now

Client portal is functionally complete but has three trust holes a paying client will hit in their first session:

1. **Run detail = raw JSON.** The screen most clients will open obsessively currently looks like a developer tool.
2. **Reports empty for ~30 days.** New clients sign, onboard, see "No report yet — wait until the 1st" for up to a month.
3. **No automation health signal.** Clients see automations exist but not whether they're healthy *right now*.

These three ship together as one cohesive "trust layer." Each is small; together they convert the portal from "dashboard" to "proof."

Non-goals: per-automation outcome templates, alert thresholds, self-serve pause, credential rotation. All deferred to P1/P2 per `2026-04-13-dashboard-design.md`.

---

## 2. Feature 1 — Automation health pill

**What:** Each automation row on `/app` (and the existing `AutomationsSection`) gets a health indicator computed from its last 7 days of runs.

**Health states** (computed from `runs` joined to `automations`):
- **Green ("healthy"):** at least one run in last 7 days, all succeeded, last run succeeded.
- **Yellow ("flaky"):** at least one failure in last 7 days, but last run succeeded.
- **Red ("failing"):** last run failed, OR no runs in last 7 days while automation status is `live`.
- **Idle ("dormant"):** automation status is `draft` or `paused` — health pill not rendered (the existing `StatusPill` already covers this).

**Where it lives:**
- New helper `computeAutomationHealth(rows)` in `lib/portal/health.ts`.
- New SQL query `listAutomationHealth(engagementId)` in `lib/portal/data.ts` returning per-automation aggregates over last 7 days.
- New component `<HealthPill state="..." />` in `app/app/_components/HealthPill.tsx`.
- `AutomationsSection` gets a new column "Health" rendering the pill (only for live automations).

**Why this design:** Pure read-side computation, zero schema changes, trivially testable. Mirrors the existing `StatusPill` pattern.

---

## 3. Feature 2 — Live "this month so far" snapshot

**What:** On `/app/reports`, when viewing the current month and the monthly cron hasn't run yet, render a "live snapshot" card *in addition to* the current empty state. The empty-state copy stays — the snapshot is additive proof that things ARE happening.

**Snapshot fields** (computed live from `runs`):
- Runs month-to-date.
- Distinct automations active this month.
- Success rate (% of runs that succeeded).
- Last successful run timestamp.

**Labeling:** Card titled **"This month so far (live)"** with subtext: *"Finalized monthly report publishes on the 1st of next month."*

**Where it lives:**
- New query `getLiveMonthSnapshot(engagementId, month)` in `lib/portal/data.ts`.
- Renders inline in `app/app/reports/page.tsx` only when viewing the current month. Historic months continue to show only the finalized outcome (or nothing if missing).

**Why this design:** Surfaces value immediately, doesn't replace the formal monthly report (which has narrative + Raijuu-blessed metrics). Two-source clarity: live = system, monthly = curated.

---

## 4. Feature 3 — Outcome renderer

**What:** Replace the raw `<pre>{JSON}</pre>` on `/app/runs/[id]` with a structured renderer.

**Soft convention** (n8n workflows are gradually migrated to write these keys; renderer falls back gracefully):
- `outcome.summary` → string, rendered as a one-line headline.
- `outcome.highlights` → string[], rendered as a bulleted list.
- `outcome.metrics` → record of label → number/string, rendered as a key-value grid.
- Any other keys → rendered as a clean key-value table at the bottom (no nesting beyond one level — nested objects fall through to the raw JSON section).

**Always-available raw view:** A `<details>` collapsible labeled "View raw payload" containing the existing pretty-printed JSON. Power users and Raijuu ops keep their tool.

**Where it lives:**
- New component `app/app/runs/[id]/_components/OutcomeRenderer.tsx`.
- Pure function: takes `outcomeJson: unknown`, returns JSX. No data fetching, no side effects.
- Accepts arbitrary JSON shape — the convention keys are *opportunistic*, never required.

**Why this design over per-automation templates:** With <5 clients, a registry of per-automation renderers creates more maintenance than value. A single tolerant renderer + soft convention is the YAGNI choice. We can extract per-template renderers later if patterns emerge.

---

## 5. Data flow (no schema changes)

All three features read from existing tables. Zero migrations. Zero new mutations.

```
runs (existing)  ──┐
                   ├──► lib/portal/data.ts (new queries)
automations (existing) ──┘                │
                                          ▼
                                  lib/portal/health.ts (computation)
                                          │
                                          ▼
                                  app/app/_components/* (rendering)
```

---

## 6. Testing

- **`computeAutomationHealth`** — unit test in `lib/portal/health.test.ts` covering all four states + edge cases (no runs at all, single run, mixed pass/fail).
- **`OutcomeRenderer`** — light snapshot/render test covering: convention-shape input, arbitrary keys input, null input.
- **Live snapshot query** — covered by existing pattern (similar to `getOutcomeForMonth`); skip dedicated test if it's a thin wrapper.
- **No e2e changes** — visual changes only, no new routes or auth surfaces.

---

## 7. Sequencing

Ship in this order (smallest blast radius first):
1. **Health pill** — new helper + new column + new pill component. ~80 LoC. Atomic commit.
2. **Live snapshot** — new query + new card on existing reports page. ~60 LoC. Atomic commit.
3. **Outcome renderer** — new component + replace `<pre>` block. ~120 LoC. Atomic commit.

Each step gates on `pnpm typecheck` + `pnpm lint` + relevant test passing before commit.

---

## 8. Out of scope (intentionally)

- Editing the n8n workflows themselves to start emitting the soft-convention keys. Renderer is forward-compatible; n8n workflows can adopt the convention as they're touched.
- Per-automation renderer registry.
- Trends/sparklines on health pill.
- Email digest of weekly health.
- Tooltips explaining health states (text label is sufficient for v1).
