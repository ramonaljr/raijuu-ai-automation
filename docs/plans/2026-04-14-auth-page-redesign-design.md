# Auth Page Redesign — Design

**Date:** 2026-04-14
**Status:** Approved (user granted autonomy after three clarifying rounds)
**Scope:** Redesign `/sign-in` and `/sign-up` pages. Keep Clerk's hosted `<SignIn />` / `<SignUp />` components (they own all flow branching — MFA, verify-email, SSO callback, reset) but wrap them in a branded, cinematic shell matching the marketing aesthetic.

---

## 1. Context

Current state: `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` each render Clerk's default component with zero customization — stark white card on unstyled background. This is the single biggest visual break in the product: every other surface (marketing, demo, admin, portal) is dark-on-near-black with the electric indigo (`#4d65ff`) accent, and auth pages are white.

Both staff (admin) and eventual portal clients hit `/sign-in`. Clients onboarding currently enter via magic-link at `/onboard/[engagementId]`, so `/sign-in` is mostly a staff door today — but per the "build for readiness" memory, we treat it as the front door for paying clients from day one.

Clerk is provided at the root via `ClerkProvider` in `app/layout.tsx`. Per-page `appearance` prop on `<SignIn />` / `<SignUp />` gives the tightest blast radius; global theming via `ClerkProvider` is deferred.

---

## 2. Goals

- Brand continuity: auth pages match the marketing/dashboard dark-cinematic aesthetic
- Zero flow-logic ownership: Clerk keeps handling MFA, verification, SSO, password reset — we only style
- Single shared layout shell usable by both sign-in and sign-up (and any future reset/verify pages)
- Reduced-motion respected (hard gate per existing `globals.css:198-207`)
- Ship in one session; no net-new dependencies

## 3. Non-Goals

- No fully-headless Clerk (`useSignIn()` hooks). Rejected — the flow-logic ownership cost isn't worth it pre-first-client.
- No testimonial/stat carousel. Rejected — requires content maintenance before we have first-client proof.
- No A/B variants for admin vs client. Rejected — overkill; shared door is fine.
- No password-reset / email-verification custom pages. Clerk handles these inside the same catch-all route.
- No Clerk `appearance` theming at the `ClerkProvider` level (global). Keep per-page for now so admin internal tools aren't blast-radius.

---

## 4. Layout

Two-panel split on `md:` and up; stacked on mobile:

```
┌─────────────────────────────────┬──────────────────────┐
│                                 │                      │
│   Brand panel (60%)             │   Clerk form (40%)   │
│   — LiveSystemPanel             │   — <SignIn /> or    │
│   — Wordmark + one-line tag     │     <SignUp />       │
│   — animated dot grid +         │   — themed via       │
│     marquee workflow runs       │     appearance prop  │
│   — mesh gradient backdrop      │                      │
│                                 │                      │
└─────────────────────────────────┴──────────────────────┘
```

**Mobile (`< md`):** brand panel collapses to a compact header (logo + tagline only, no motion), Clerk form takes remaining viewport. LiveSystemPanel animation is hidden on mobile to preserve perf and keep the form dominant.

**Backgrounds:**
- Brand panel: near-black `#0a0a0a` base, dot-grid overlay (reuse `.dot-grid` from `globals.css:77`), a subtle mesh gradient (reuse the footer mesh vocabulary from `globals.css:176`), and a soft radial gradient from the indigo accent at ~25% opacity.
- Form panel: solid dark surface `#141414` to contrast the form card and focus attention.

---

## 5. Components

### 5.1 `components/auth/AuthShell.tsx` (new)

Server component. Props:
- `children: ReactNode` — the Clerk component
- `title: string` — e.g., "Welcome back" | "Create your account"
- `footerSlot?: ReactNode` — small link row under the form (e.g., "New here? Sign up")

Renders the two-panel layout, embeds `<LiveSystemPanel />` in the brand column, renders `children` in the form column. No motion logic itself — purely layout + background treatments (CSS only, uses existing utility classes).

### 5.2 `components/auth/LiveSystemPanel.tsx` (new, client component)

`'use client'`. Pure CSS animation (no Framer Motion needed here). Composes:
- Wordmark ("Raijuu") — static, large display type
- One-line tag: "Automation that runs itself."
- **Ticker strip** (reuses `.animate-ticker` from `globals.css:96`) with fake-but-plausible workflow run rows:
  - `▸ acme-corp · invoice-sync · 2.3s · ✓`
  - `▸ contoso · lead-routing · 1.1s · ✓`
  - `▸ northwind · digest-email · 4.7s · ✓`
  - (8–10 rows, purely cosmetic, hardcoded)
- Subtle dot-grid overlay via `.dot-grid`

No real data fetch — this is decorative, not a dashboard widget. Keeps auth pages static-renderable and fast.

Reduced-motion: `.animate-ticker` is already nuked by the existing `prefers-reduced-motion` block in `globals.css:198-207`, so the strip becomes a static list when reduced motion is on. No extra work.

### 5.3 `components/auth/clerkAppearance.ts` (new)

Exports a single typed `appearance` object passed to `<SignIn />` / `<SignUp />`. Maps:
- `colorPrimary` → `#4d65ff` (our accent)
- `colorBackground` → `#141414` (dark surface)
- `colorText` → `#f9fafb`
- `colorTextSecondary` → `#6b7280`
- `colorInputBackground` → `#1f1f1f`
- `colorInputText` → `#f9fafb`
- `borderRadius` → `0.75rem` (matches marketing card radius)
- `fontFamily` → `var(--font-geist-sans)`
- `elements` overrides for `card` (remove Clerk's default box-shadow/border since our shell already provides framing), `headerTitle` / `headerSubtitle` (hidden — our `AuthShell` owns the title), `socialButtonsBlockButton` (dark treatment).

Kept in its own file so sign-in and sign-up share the exact same tokens and drift can't happen.

### 5.4 Modified: `app/sign-in/[[...sign-in]]/page.tsx`

```tsx
import { SignIn } from '@clerk/nextjs';
import AuthShell from '@/components/auth/AuthShell';
import { clerkAppearance } from '@/components/auth/clerkAppearance';

export default function Page() {
  return (
    <AuthShell title="Welcome back" footerSlot={<SignUpLink />}>
      <SignIn appearance={clerkAppearance} />
    </AuthShell>
  );
}
```

### 5.5 Modified: `app/sign-up/[[...sign-up]]/page.tsx`

Mirror of the above, with `<SignUp />` and a title like "Create your account".

---

## 6. Data Flow

None. Auth pages are static / server-rendered; all dynamic behavior stays inside Clerk's components. `LiveSystemPanel` renders hardcoded decorative data — no fetch, no props wired to real run data.

---

## 7. Error Handling

Nothing custom. Clerk renders its own error states inside the form card. Our shell never throws.

---

## 8. Testing

- **Visual/manual:** open `/sign-in` and `/sign-up` at desktop (1440px) and mobile (375px) widths; confirm layout flip and that the LiveSystemPanel is hidden on mobile.
- **Reduced motion:** toggle the OS preference; confirm the ticker freezes to a static list.
- **Flow regression:** complete one sign-in and one sign-up against the local Clerk test instance — confirm nothing about the redesign broke email verification, password reset, or social sign-in sub-routes that Clerk renders inside the catch-all.
- **Accessibility:** tab order goes brand-panel-skipped → form inputs → submit → footer link. Form inputs keep visible focus rings (our global `:focus-visible` rule already covers this).
- No new unit tests. `AuthShell` and `LiveSystemPanel` are pure presentation — their logic is CSS and literal data.

---

## 9. Risks / Open Questions

1. **Clerk version pin.** Need to check `package.json` during planning to confirm `@clerk/nextjs` version supports the `appearance.elements` override keys we use. If it doesn't, fall back to CSS variable overrides only.
2. **Next.js 16.2.2 breaking changes (per `AGENTS.md`).** Before implementation, the plan must require reading `node_modules/next/dist/docs/01-app/…` sections on Server Components + `'use client'` boundaries to confirm the split (AuthShell server, LiveSystemPanel client) is still idiomatic.
3. **Brand panel on very tall viewports.** LiveSystemPanel ticker needs a vertical mask so rows don't visibly spawn at the edges. Already have `.hero-mask` vocabulary in `globals.css:137` — reuse or adapt.

---

## 10. Out-of-Scope Follow-ups

- Global `ClerkProvider` theming (would unify Clerk's `<UserButton />` and any other embedded Clerk UI in the admin/app surfaces)
- A real "recent activity" widget pulling from the `runs` table — this would be a dashboard concern, not an auth-page concern
- Sign-out confirmation page styling
