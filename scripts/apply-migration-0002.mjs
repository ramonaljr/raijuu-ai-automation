/**
 * One-off: applies lib/db/migrations/0002_red_owl.sql via Neon HTTP.
 *
 * drizzle-kit's migrator hung silently against this Neon project for reasons
 * I never isolated. This runs each statement as a raw SQL call then records
 * the journal entry so drizzle-kit won't try to re-apply.
 *
 * Idempotent: bails early when the journal already has this hash, and each
 * CREATE uses IF NOT EXISTS semantics by virtue of checking sys catalogs
 * before applying (see skipIfExists).
 */
import { config as loadEnv } from 'dotenv';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

loadEnv({ path: '.env.local', override: true });

// `fullResults: true` keeps us in query-mode rather than template-tag-only.
const sql = neon(process.env.DATABASE_URL, { fullResults: true });

const MIGRATION_PATH = './lib/db/migrations/0002_red_owl.sql';
const migrationSql = await readFile(MIGRATION_PATH, 'utf8');
const hash = createHash('sha256').update(migrationSql).digest('hex');

const applied = await sql`
  SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = ${hash} LIMIT 1
`;
if (applied.rows.length > 0) {
  console.log('Migration 0002 already recorded — verifying DB state.');
}

async function tableExists(name) {
  const { rows } = await sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${name}
  `;
  return rows.length > 0;
}

async function indexExists(name) {
  const { rows } = await sql`
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = ${name}
  `;
  return rows.length > 0;
}

async function runRaw(stmt) {
  // Neon HTTP's raw-query path: call the client function with a query object.
  // The tagged template is one path; this is the other.
  return sql.query(stmt);
}

// Manual per-statement application with existence checks so re-runs are safe.
const steps = [
  {
    label: 'webhook_dead_letter table',
    check: () => tableExists('webhook_dead_letter'),
    sql: `CREATE TABLE "webhook_dead_letter" (
      "id" serial PRIMARY KEY NOT NULL,
      "source" text NOT NULL,
      "payload" jsonb NOT NULL,
      "error_message" text NOT NULL,
      "received_at" timestamp DEFAULT now() NOT NULL,
      "resolved_at" timestamp,
      "retry_count" integer DEFAULT 0 NOT NULL
    )`,
  },
  {
    label: 'webhook_dead_letter_source_idx',
    check: () => indexExists('webhook_dead_letter_source_idx'),
    sql: `CREATE INDEX "webhook_dead_letter_source_idx" ON "webhook_dead_letter" USING btree ("source")`,
  },
  {
    label: 'webhook_dead_letter_received_at_idx',
    check: () => indexExists('webhook_dead_letter_received_at_idx'),
    sql: `CREATE INDEX "webhook_dead_letter_received_at_idx" ON "webhook_dead_letter" USING btree ("received_at")`,
  },
  {
    label: 'engagements_lead_id_partial_uniq',
    check: () => indexExists('engagements_lead_id_partial_uniq'),
    sql: `CREATE UNIQUE INDEX "engagements_lead_id_partial_uniq" ON "engagements" USING btree ("lead_id") WHERE "engagements"."lead_id" IS NOT NULL`,
  },
];

for (const step of steps) {
  if (await step.check()) {
    console.log(`  ✓ ${step.label} already exists`);
    continue;
  }
  console.log(`  • Creating ${step.label}…`);
  await runRaw(step.sql);
  console.log(`    done.`);
}

if (applied.rows.length === 0) {
  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${hash}, ${Date.now()})
  `;
  console.log('Recorded in drizzle journal.');
} else {
  console.log('Journal already up to date.');
}

console.log('Migration 0002 fully applied.');
