import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Build vs. runtime distinction:
// - `next build` (NEXT_PHASE=phase-production-build) evaluates this module to
//   collect page data. Env vars aren't always injected into the build step
//   (Railway, CI, Docker), so a placeholder is acceptable — no query runs.
// - At runtime in production, a missing DATABASE_URL means the app is broken;
//   fail loud at startup rather than serving a long stream of confusing
//   connection errors on every request.
const isProdRuntime =
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PHASE !== 'phase-production-build';

if (isProdRuntime && !process.env.DATABASE_URL) {
  // Don't include any default placeholder in the message — we want to fail
  // before that silent fallback can be mistaken for a working config.
  throw new Error(
    '[db] DATABASE_URL is required at runtime. The app cannot start without it.',
  );
}

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://placeholder:placeholder@localhost:5432/placeholder';

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
export type DB = typeof db;

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
