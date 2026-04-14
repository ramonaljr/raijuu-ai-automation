/**
 * Deletes duplicate test-fixture engagements (keeps the oldest per lead_id),
 * verifies they have no dependent rows, then applies the partial unique index
 * that was blocked by the duplicates.
 *
 * Safety: only targets rows where the linked lead's email ends in
 * @raijuu.test. Real-client data is untouched.
 */
import { config as loadEnv } from 'dotenv';
import { neon } from '@neondatabase/serverless';

loadEnv({ path: '.env.local', override: true });
const sql = neon(process.env.DATABASE_URL, { fullResults: true });

// 1. Identify duplicate lead_ids, and for each, list all engagements ordered
//    by id (oldest first). We'll keep the oldest, delete the rest — but only
//    if the lead email is a test-fixture pattern.
const { rows: dupeGroups } = await sql`
  SELECT e.lead_id, l.email, array_agg(e.id ORDER BY e.id) AS engagement_ids
  FROM engagements e
  INNER JOIN leads l ON l.id = e.lead_id
  WHERE e.lead_id IS NOT NULL
  GROUP BY e.lead_id, l.email
  HAVING COUNT(*) > 1
`;

console.log(`Found ${dupeGroups.length} duplicate groups.`);

const idsToDelete = [];
for (const g of dupeGroups) {
  if (!String(g.email).endsWith('@raijuu.test')) {
    console.log(`  SKIP lead_id=${g.lead_id} email=${g.email} — not a test fixture`);
    continue;
  }
  const [keep, ...rest] = g.engagement_ids;
  console.log(
    `  lead_id=${g.lead_id} email=${g.email} keep=${keep} delete=[${rest.join(',')}]`,
  );
  idsToDelete.push(...rest);
}

if (idsToDelete.length === 0) {
  console.log('\nNothing to delete.');
  process.exit(0);
}

// 2. Check for dependent rows we'd orphan. All four tables use
//    ON DELETE RESTRICT, so the DELETE would fail with a foreign-key error
//    if any exist — but a clean pre-check gives a better error message.
async function countWhereEngagementIn(table, col = 'engagement_id') {
  const { rows } = await sql.query(
    `SELECT COUNT(*)::int AS n FROM ${table} WHERE ${col} = ANY($1)`,
    [idsToDelete],
  );
  return rows[0].n;
}

const dependents = {
  automations: await countWhereEngagementIn('automations'),
  intake_submissions: await countWhereEngagementIn('intake_submissions'),
  outcomes_monthly: await countWhereEngagementIn('outcomes_monthly'),
};
console.log('\nDependent rows:', dependents);
const hasDependents = Object.values(dependents).some((n) => n > 0);
if (hasDependents) {
  console.log('Refusing to delete — unexpected dependent rows. Aborting.');
  process.exit(1);
}

// 3. Delete. Parameterised so the driver handles the int[] safely.
const { rows: deleted } = await sql.query(
  `DELETE FROM engagements WHERE id = ANY($1) RETURNING id`,
  [idsToDelete],
);
console.log(`\nDeleted ${deleted.length} rows.`);

// 4. Now apply the blocked index.
console.log('\nApplying engagements_lead_id_partial_uniq…');
await sql.query(
  `CREATE UNIQUE INDEX "engagements_lead_id_partial_uniq" ON "engagements" USING btree ("lead_id") WHERE "engagements"."lead_id" IS NOT NULL`,
);
console.log('Index created.');

// 5. Verify.
const { rows: idx } = await sql`
  SELECT indexname FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'engagements_lead_id_partial_uniq'
`;
console.log('Index present:', idx.length === 1);
