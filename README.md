# Raijuu AI Automation

Marketing site + four-surface funnel dashboard (gated demo, intake, ops console, client portal) for a done-for-you AI automation agency. Next.js 16 + Clerk + Drizzle/Neon on top of an internal n8n engine.

See `docs/plans/2026-04-13-dashboard-design.md` for the full product design.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, Turbopack)
- **Styling:** Tailwind 4
- **Motion / 3D:** Framer Motion + React Three Fiber (marketing surfaces only)
- **Auth:** Clerk (email + OTP, role-based access)
- **Database:** Neon (Postgres) via Drizzle ORM
- **Validation:** Zod 4
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Package manager:** **pnpm** (never npm or yarn)

## Local Development

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- A [Neon](https://neon.tech) project (free tier)
- A [Clerk](https://clerk.com) application (free tier)

### First-time setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create .env.local from the template
cp .env.example .env.local
```

Populate `.env.local` with real values:

- **`DATABASE_URL`** — Neon pooled Postgres connection string.
  Get it via CLI: `npx neonctl connection-string --pooled --role-name neondb_owner`
  Or copy from Neon dashboard → Project → Connection Details (pick "Pooled connection").
  Must begin with `postgresql://` — NOT the `https://.../rest/v1` Neon Data API URL.
- **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`** — `pk_test_...` from Clerk dashboard → API Keys. Safe to expose.
- **`CLERK_SECRET_KEY`** — `sk_test_...` from Clerk dashboard → API Keys. **Do NOT commit, do NOT share in chat/issues.** If ever exposed, rotate immediately in Clerk dashboard.
- The four `NEXT_PUBLIC_CLERK_*_URL` lines can stay at their defaults.
- `DATABASE_URL_CI` is optional; point it at a separate Neon branch when you want isolated CI runs.

### Phase 1 demo env vars (all optional in dev)

The `/demo` gated funnel integrates three external services. **All three are optional at dev time** — the form submits fine without any of them (Turnstile/Resend short-circuit, Cal.com CTA renders a "not configured" notice).

- **`NEXT_PUBLIC_CAL_USERNAME`** — Your [Cal.com](https://cal.com) public username (e.g. `jane-doe`). Used by the "Book a call" CTA on the demo result screen.
- **`RESEND_API_KEY`** + **`RESEND_FROM`** + **`RESEND_ADMIN_EMAIL`** — Sign up at [Resend](https://resend.com) (3k free emails/mo). `RESEND_FROM` must be a verified sending domain — for testing, `onboarding@resend.dev` works out of the box. `RESEND_ADMIN_EMAIL` is where admin notifications land on each demo submission.
- **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`** + **`TURNSTILE_SECRET_KEY`** — Get from [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) (unlimited free). When both are set, the demo form renders the Turnstile widget and the server action verifies the token before writing a lead.
- **`IP_HASH_SALT`** — Any stable random string. Used to hash submitter IPs for rate-limit tracking (we never store raw IPs). Set to a fresh value in prod; the default fallback is fine for local dev.
- **`APP_BASE_URL`** — Set in production to the public origin (e.g. `https://raijuu.ai`) so magic-link onboarding emails point at the right domain. In dev, leave it at `http://localhost:3000` or omit — the API falls back to the request origin (which would otherwise bake Vercel preview URLs into emails).

### Phase 4 portal + cron env vars

- **`N8N_WEBHOOK_SECRET`** — Shared secret for the `/api/n8n/run-callback` webhook. Set it here AND in your n8n HTTP Request node's `Authorization: Bearer <value>` header. If unset, the webhook rejects everything with 401. The unique index on `runs.n8n_execution_id` makes the insert idempotent — n8n's own retries are safe.
- **`CRON_SECRET`** — Authorizes `/api/cron/aggregate-monthly`. In production, a GitHub Actions workflow (`.github/workflows/cron-monthly.yml`) fires `0 6 1 * *` (06:00 UTC on the 1st) and curls the endpoint with this secret. The workflow reads `CRON_SECRET` and `APP_PROD_URL` from repo-scoped GitHub Actions secrets. Set them via:
  ```bash
  echo "<secret>" | gh secret set CRON_SECRET --app actions
  echo "https://your-app.example.com" | gh secret set APP_PROD_URL --app actions
  ```
  You can also trigger the workflow manually from the GitHub Actions UI (`workflow_dispatch`). Locally, recompute last month with:
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" \
    http://localhost:3000/api/cron/aggregate-monthly
  ```
  Response: `{ "ok": true, "month": "2026-03", "upserts": <n> }`.

### Engagement claiming (`/app`)

The first time a signed-in client hits `/app`, the layout looks up engagements where `lead.email` matches their Clerk primary email and `clerk_user_id` is null. If exactly one matches, it's atomically claimed. Zero or multiple matches redirect to `/no-engagement` — a dead-end page asking the client to contact you. Fix manually via `pnpm db:studio` (set `engagements.clerk_user_id`) or by ensuring the client signs up with the email recorded in `leads.email`.

### Apply the database schema

```bash
pnpm db:migrate
```

### Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Grant yourself the admin role

`/admin` is gated — you need Clerk `publicMetadata.role = "admin"` to access it. After signing up the first time:

1. Open Clerk dashboard → **Users** → click your user.
2. **Metadata** tab → **Public metadata** → add:
   ```json
   { "role": "admin" }
   ```
3. Save and re-sign-in (or wait a session refresh).

For test clients, use `{ "role": "client" }` instead — they get `/app` but not `/admin`.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:e2e` | Run E2E tests (Playwright + Chromium, boots `pnpm dev`) |
| `pnpm db:generate` | Generate a new Drizzle migration from `lib/db/schema.ts` |
| `pnpm db:migrate` | Apply pending migrations to `DATABASE_URL` |
| `pnpm db:studio` | Open Drizzle Studio against `DATABASE_URL` |

## Project Layout

```
app/                         Next.js App Router
  page.tsx                   Marketing landing (public)
  layout.tsx                 Root layout — ClerkProvider lives here
  sign-in/[[...sign-in]]/    Clerk sign-in catch-all
  sign-up/[[...sign-up]]/    Clerk sign-up catch-all
  app/                       Client portal (role: client | admin)
  admin/                     Ops console (role: admin)
  demo/                      Gated demo (Phase 1)
  onboard/[engagementId]/    Magic-link intake flow (Phase 2)

  admin/_components/         Shared admin table primitives (Phase 3)
  admin/leads/               Leads table + convert-to-client (Phase 3)
  admin/clients/             Engagements list + detail (Phase 3)
  admin/clients/[id]/        Engagement detail with joined lead/intake
  admin/automations/         Automations list (empty until Phase 4)
  admin/intake/              Intake submissions list + detail (Phase 3)

components/                  Shared UI (existing marketing components)
lib/
  db/
    index.ts                 Neon + Drizzle client
    schema.ts                All tables, enums, indexes, type exports
    migrations/              Drizzle-generated SQL
  auth/
    roles.ts                 getRole() — maps publicMetadata to Role
    roles.test.ts
  admin/                     Server-side query helpers per admin surface
  intake/                    Magic-link helpers + intake schemas (Phase 2)
  demo/                      Demo content + submission helpers (Phase 1)
tests/e2e/                   Playwright specs
drizzle.config.ts            Drizzle Kit config
.github/workflows/           CI + cron (monthly outcomes aggregation)
docs/plans/                  Design + implementation plans
```

## Conventions

- **AGENTS.md / CLAUDE.md rule:** Next.js 16 has breaking changes from older docs. Consult `node_modules/next/dist/docs/` before writing middleware, layouts, or server actions.
- **Clerk v7:** use `clerkMiddleware` (not `authMiddleware`), place `<ClerkProvider>` inside `<body>`, use `<Show when="signed-in">` (not `<SignedIn>`). `auth()` is async — always `await`.
- **Zod 4:** `z.record(V)` requires a key schema (`z.record(z.string(), V)`). Error formatting moved to `z.treeifyError`.
- **No `git add .` / `git add -A`** — always stage specific paths to avoid leaking `.env.local` or accidentally committing credentials.

## Architecture

The dashboard is the software layer of a sales → onboarding → delivery → reporting funnel. n8n is the automation engine (private, never client-facing). See `docs/plans/2026-04-13-dashboard-design.md` for the full design.

### Rehearsal

Before Client #1 touches production, walk through `docs/plans/2026-04-14-phase-5-rehearsal.md` (the "Pre-flight checklist" section at the bottom). It steps you through the full funnel against test data and flags what to watch for.
