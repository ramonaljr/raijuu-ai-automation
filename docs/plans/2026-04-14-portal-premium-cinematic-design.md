# Portal Premium-Cinematic Redesign — Design

**Date:** 2026-04-14
**Status:** Approved (user granted autonomy mid-brainstorm)
**Scope:** Visual redesign of the client portal (`/app`, `/app/runs`, `/app/reports`, `/no-engagement`, `/sign-in`). Admin surface (`/admin`) is out of scope and intentionally stays utilitarian.
**Supersedes:** `2026-04-14-phase-4-client-portal.md` for visual concerns only (functional scope there remains valid).

---

## 1. Problem

The portal at `/app` currently reuses admin-grade table primitives (`app/admin/_components/{Table,StatusPill,EmptyState}`). It works, but it reads as an internal ops tool — not as the paying-client surface that sits one click away from the cinematic marketing site at `/`. Context break between `/` (Preloader, Hero, Three.js blob, gradient text, cinematic motion) and `/app` (bare H1 + table) damages the "premium done-for-you" positioning.

## 2. Direction

Two simultaneous moves:

1. **Premium product dashboard** — Linear/Vercel/Stripe register. Light surface, generous whitespace, strong typographic hierarchy, shared layout conventions clients already know.
2. **Cinematic brand continuation** — reuse the motion vocabulary already in `components/shared/motion.tsx` (`FadeIn`, `TextReveal`, `ScaleIn`, `StaggerChildren`) and the token palette from `app/globals.css` (`--accent #4d65ff`, Geist Sans/Mono) so the portal reads as the same product as `/`, not a foreign dashboard.

The tension between (1) and (2) is resolved by scoping motion to **signature moments, not every interaction** — users return weekly, they need speed, not choreography.

## 3. Decisions

| # | Decision | Chosen | Rejected |
|---|---|---|---|
| 1 | Design direction | Premium dashboard + cinematic continuation | Utilitarian polish only |
| 2 | Palette | Light portal | Dark portal; light/dark hybrid |
| 3 | Shell | Left sidebar (260px, fixed) | Top-tab; floating pill |
| 4 | Overview composition | Single-canvas focus view | Mission-control KPI dashboard; automations-first polish |
| 5 | Motion dosage | Signature moments | Restrained; full cinematic |

## 4. Visual System

**Reuse (no change):** `--accent: #4d65ff`, `--accent-light: #6b7fff`, Geist Sans/Mono, `.dot-grid` utility, `prefers-reduced-motion` accessibility gate, all primitives in `components/shared/motion.tsx`.

**Add (portal-only tokens in `app/globals.css`):**
- `--portal-surface: #fafafa` — sidebar + page background tint
- `--portal-card: #ffffff` — content card surface
- `--portal-border: rgba(10, 10, 10, 0.08)` — hairline dividers

**Type scale:**
- Page H1 — `text-2xl font-semibold tracking-tight`
- Overview greeting — `text-4xl font-semibold tracking-tight`, wrapped in `TextReveal`
- Section eyebrow — `text-xs uppercase tracking-[0.14em] text-neutral-500`
- Body/table — `text-sm`
- Metadata (timestamps, IDs) — Geist Mono `text-xs text-neutral-500`

**Card treatment:** `rounded-2xl`, `border border-[--portal-border]`, `shadow-[0_1px_2px_rgba(10,10,10,0.04)]`, default padding `p-6`, hero padding `p-8`. No gradients except the Overview focus card.

## 5. Shell — Left Sidebar

Fixed 260px, full height, `bg-[--portal-surface]`, right border `--portal-border`.

```
┌──────────────────────────┐
│ [Zap] Raijuu             │  brand lockup, links to /app
│                          │
│ ▸ n8n Smoke Co        ⌄ │  engagement switcher (visual stub)
│                          │
│ WORKSPACE                │
│ ● Overview               │  active: left accent bar, bg-neutral-100
│   Automations            │
│   Runs                   │
│   Reports                │
│                          │
│ ACCOUNT                  │
│   Settings               │  stub route
│   Help                   │  mailto: support
│                          │
│ ─────────                │
│ [User] ramon@…      ⌃   │  UserButton + email, bottom-anchored
└──────────────────────────┘
```

**Active state:** 2px `--accent` left bar, bolder text, `bg-neutral-100`.
**Hover:** background slides in from left over 120ms — the per-interaction signature motion beat.
**Mobile (<768px):** sidebar collapses behind a hamburger in a slim top bar; drawer uses `framer-motion` slide-in from left.

**Content area:** `max-w-5xl mx-auto px-8 py-10`. Every page starts with a header block (eyebrow + H1 + optional subtitle) followed by `space-y-8`.

## 6. Overview Page (`/app`)

Composition, top-to-bottom:

1. **Greeting block** — eyebrow (engagement name), `text-4xl` greeting using user's first name, wrapped in `TextReveal`. Fires once per session (sessionStorage flag) so return visits aren't theatrical.
2. **Focus card** — the hero. Full-width, `p-8`, `rounded-2xl`, soft gradient `bg-gradient-to-br from-[#4d65ff]/[0.03] to-transparent`, subtle border. Adapts to state:
   - **Scheduled run exists:** "Next run in `<countdown>`" + automation name + cron summary + link.
   - **History exists, no schedule:** "Last run `<relative>`" + success/fail summary + "View run" link.
   - **Draft-only (current state):** "We're building your first automation" + expected launch + "Contact your engineer" mailto. Turns sparse data into a feature.
   - `ScaleIn(0.97)` on first render.
3. **Recent activity rail** — 3 most recent runs. Compact row: status dot, automation name, relative timestamp (Mono), click-through. Hidden entirely when zero runs. No rail for draft-only state.
4. **Automations section** — eyebrow + table. Table columns: Name, What it does, Status, Next run / Last run. `StaggerChildren` on rows (stagger 0.08, once per session, amount 0.1). Status pill `running` gets `animate-pulse` ring.

## 7. Other Portal Pages

**`/app/runs`** — same shell; page header + filter row (status dropdown, automation dropdown, date range) + run table. Row click navigates to `/app/runs/[id]`. Row detail is a skeletal stub for this cycle: run ID, status, started/finished, raw payload in Mono block — no timeline visualization yet.

**`/app/reports`** — stays a skeleton per "ready across all surfaces" principle. Page header + empty state: "Reports land here when your first monthly cycle closes. Your first report is expected `<date>`." No charts, no data fetching beyond engagement lookup.

**`/no-engagement`** — rebuilt in portal shell (no sidebar, centered card on `--portal-surface`). Warm copy: "We don't have an engagement tied to this email yet." + mailto CTA + sign-out button.

**`/sign-in`** — wrapped in portal shell. Split layout: left half hosts the Clerk embed on white, right half hosts a brand panel on `--dark-bg` with the `HeroBlob` shrunk to ~400px and a single tagline. Mobile stacks vertically with the brand panel collapsed to a 120px top strip.

## 8. Motion Inventory

| Trigger | Beat | Notes |
|---|---|---|
| Route change | 150ms crossfade on content area | Uses Next.js layout with `key={pathname}` + Framer AnimatePresence |
| Overview greeting first load | `TextReveal` blur→sharp | Once per session, sessionStorage flag |
| Overview focus card mount | `ScaleIn(0.97)` | Always |
| Automations table rows | `StaggerChildren` stagger 0.08 | Once per session |
| Sidebar item hover | `bg-neutral-100` slide from left, 120ms | Always |
| Status pill `running` | `animate-pulse` ring | Always |
| `prefers-reduced-motion: reduce` | All above become instant | Already gated; each primitive checks `useReducedMotion()` |

No parallax, no count-ups, no scroll-triggered reveals on return-visit surfaces. Those remain marketing-only vocabulary.

## 9. Data Flow

No new data contracts. All reads continue through `lib/portal/*`:
- `getEngagementForUser(userId, email)` — already exists, used by layout.
- `getEngagementByClerkUserId(userId)` — already exists, used by Overview.
- `listAutomationsForEngagement(engagementId)` — already exists.
- **New:** `getRecentRunsForEngagement(engagementId, limit = 3)` — for Overview activity rail. Returns `Run[]` sorted by `startedAt` desc.
- **New:** `getNextScheduledRunForEngagement(engagementId)` — for Overview focus card. Returns `{ runAt: Date; automation: Automation } | null`.
- **New:** `getLastRunForEngagement(engagementId)` — for Overview focus card fallback. Returns `Run | null`.

All new helpers are thin wrappers over existing Drizzle queries. No schema changes.

## 10. Error Handling

- All data reads wrapped in server component try/catch; on error, render a quiet error card ("We couldn't load this section — refresh to retry") in place of content, not a full-page crash.
- Focus card gracefully degrades: if both `getNextScheduledRunForEngagement` and `getLastRunForEngagement` fail, fall through to the draft-only copy.
- Sidebar UserButton uses Clerk's own error states.
- All `Link` targets validated at build via TypeScript route types.

## 11. Testing

- **Unit (Vitest):** portal-specific formatters (countdown, relative timestamp), focus-card state selector (which of the three variants based on data).
- **Component (Vitest + Testing Library):** sidebar active-route highlighting, focus card renders correct variant for each data shape, automations table empty state.
- **Visual (Playwright):** snapshot per portal page × (light only) × (wide + narrow viewport). Stored under `tests/visual/portal/`.
- **Motion:** one Playwright test asserts `prefers-reduced-motion` disables the greeting `TextReveal`.
- **E2E smoke:** existing rehearsal flow must still pass — sign in → see Overview → navigate to Runs → navigate back.

## 12. Scope Boundary

**In:**
- Portal tokens + type scale in `globals.css`
- Sidebar shell component (reusable `<PortalShell>`)
- Overview focus view with three state variants
- Automations table polish (sticky header, stagger, running-pulse)
- Runs list polish
- `/no-engagement` refresh
- `/sign-in` brand-panel layout
- Empty + loading states across all portal routes
- Visual regression snapshots
- Motion audit per inventory table

**Out (stubs only):**
- Engagement switcher (visual only; one engagement for now)
- Settings route (404 → mailto for this cycle)
- Help route (mailto link)
- `/app/reports` polish (stays skeleton)
- Run detail page polish (raw dump only)

**Explicitly not touching:**
- `/admin/*` (different register, stays utilitarian)
- `/` marketing site
- `/demo`, `/onboard/*`
- Clerk configuration, auth flows, middleware logic
- Database schema
- n8n integration

## 13. Sequencing Intent (for writing-plans)

Suggested build order, smallest blast radius first:
1. Tokens + `<PortalShell>` component (sidebar + content area skeleton).
2. Swap `/app/layout.tsx` to render `<PortalShell>`. Existing content still renders; nothing visually landed yet.
3. Build `<OverviewGreeting>` + `<FocusCard>` + variants. Replace `/app/page.tsx` content.
4. Build new data helpers (`getRecentRunsForEngagement`, `getNextScheduledRunForEngagement`, `getLastRunForEngagement`).
5. Wire recent activity rail.
6. Polish automations table (stagger + running-pulse + sticky header).
7. `/app/runs` polish + filter row.
8. `/no-engagement` + `/sign-in` redesigns.
9. Empty + loading states audit.
10. Motion inventory audit + reduced-motion test.
11. Playwright visual snapshots.

Each step a separate commit; each step independently shippable.
