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
  demo/                      Gated demo (Phase 1, TBD)

components/                  Shared UI (existing marketing components)
lib/
  db/
    index.ts                 Neon + Drizzle client
    schema.ts                All tables, enums, indexes, type exports
    migrations/              Drizzle-generated SQL
  auth/
    roles.ts                 getRole() — maps publicMetadata to Role
    roles.test.ts
tests/e2e/                   Playwright specs
proxy.ts                     Clerk auth + role-based route protection
drizzle.config.ts            Drizzle Kit config
docs/plans/                  Design + implementation plans
```

## Conventions

- **AGENTS.md / CLAUDE.md rule:** Next.js 16 has breaking changes from older docs. Consult `node_modules/next/dist/docs/` before writing middleware, layouts, or server actions.
- **Clerk v7:** use `clerkMiddleware` (not `authMiddleware`), place `<ClerkProvider>` inside `<body>`, use `<Show when="signed-in">` (not `<SignedIn>`). `auth()` is async — always `await`.
- **Zod 4:** `z.record(V)` requires a key schema (`z.record(z.string(), V)`). Error formatting moved to `z.treeifyError`.
- **No `git add .` / `git add -A`** — always stage specific paths to avoid leaking `.env.local` or accidentally committing credentials.

## Architecture

The dashboard is the software layer of a sales → onboarding → delivery → reporting funnel. n8n is the automation engine (private, never client-facing). See `docs/plans/2026-04-13-dashboard-design.md` for the full design.
