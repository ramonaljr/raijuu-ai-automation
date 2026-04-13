import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  uuid,
} from 'drizzle-orm/pg-core';

export const engagementStatus = pgEnum('engagement_status', [
  'onboarding',
  'active',
  'paused',
  'churned',
]);

export const automationStatus = pgEnum('automation_status', [
  'draft',
  'live',
  'paused',
  'error',
]);

export const runStatus = pgEnum('run_status', [
  'success',
  'failure',
  'running',
]);

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  industry: text('industry').notNull(),
  situationText: text('situation_text').notNull(),
  demoResultKey: text('demo_result_key'),
  ipHash: text('ip_hash'),
  turnstileVerified: boolean('turnstile_verified').default(false),
  bookedAt: timestamp('booked_at'),
  source: text('source'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const engagements = pgTable('engagements', {
  id: serial('id').primaryKey(),
  leadId: integer('lead_id').references(() => leads.id),
  companyName: text('company_name').notNull(),
  status: engagementStatus('status').default('onboarding').notNull(),
  magicLinkToken: uuid('magic_link_token').defaultRandom().notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  monthlyFeeCents: integer('monthly_fee_cents'),
  clerkUserId: text('clerk_user_id'), // populated when client first logs into /app
});

export const intakeSubmissions = pgTable('intake_submissions', {
  id: serial('id').primaryKey(),
  engagementId: integer('engagement_id')
    .references(() => engagements.id)
    .notNull(),
  toolsJson: jsonb('tools_json').notNull(),
  credentialsVaultRef: text('credentials_vault_ref'),
  goalsText: text('goals_text').notNull(),
  constraintsText: text('constraints_text'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});

export const automations = pgTable('automations', {
  id: serial('id').primaryKey(),
  engagementId: integer('engagement_id')
    .references(() => engagements.id)
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  n8nWorkflowId: text('n8n_workflow_id'),
  status: automationStatus('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const runs = pgTable('runs', {
  id: serial('id').primaryKey(),
  automationId: integer('automation_id')
    .references(() => automations.id)
    .notNull(),
  startedAt: timestamp('started_at').notNull(),
  finishedAt: timestamp('finished_at'),
  status: runStatus('status').notNull(),
  outcomeJson: jsonb('outcome_json'),
  n8nExecutionId: text('n8n_execution_id'),
});

export const outcomesMonthly = pgTable('outcomes_monthly', {
  id: serial('id').primaryKey(),
  engagementId: integer('engagement_id')
    .references(() => engagements.id)
    .notNull(),
  month: text('month').notNull(), // ISO YYYY-MM
  runsCount: integer('runs_count').default(0).notNull(),
  timeSavedMinutes: integer('time_saved_minutes').default(0).notNull(),
  dollarsInfluencedCents: integer('dollars_influenced_cents').default(0).notNull(),
  narrativeMd: text('narrative_md'),
});
