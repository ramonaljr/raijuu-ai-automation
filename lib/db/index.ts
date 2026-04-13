import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Allow module evaluation without DATABASE_URL so `next build` can collect
// page data in environments where env vars aren't injected into the build step
// (e.g. Railway, Docker). If the URL isn't actually set by runtime, the first
// query will fail with a connection error — which is the correct failure mode.
const connectionString =
  process.env.DATABASE_URL ?? 'postgres://placeholder:placeholder@localhost:5432/placeholder';

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
export type DB = typeof db;

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
