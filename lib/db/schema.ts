import { sql } from 'drizzle-orm';
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
  index,
  uniqueIndex,
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

export const leads = pgTable(
  'leads',
  {
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
  },
  (t) => ({
    emailIdx: index('leads_email_idx').on(t.email),
  }),
);

export const engagements = pgTable(
  'engagements',
  {
    id: serial('id').primaryKey(),
    leadId: integer('lead_id').references(() => leads.id, {
      onDelete: 'restrict',
    }),
    companyName: text('company_name').notNull(),
    status: engagementStatus('status').default('onboarding').notNull(),
    magicLinkToken: uuid('magic_link_token').defaultRandom().notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    monthlyFeeCents: integer('monthly_fee_cents'),
    clerkUserId: text('clerk_user_id'), // populated when client first logs into /app
  },
  (t) => ({
    leadIdIdx: index('engagements_lead_id_idx').on(t.leadId),
    // Partial unique: at most one engagement per lead. NULL leadId is excluded
    // so legacy rows without a lead can coexist. Prevents concurrent duplicate
    // conversions from /api/admin/engagements/create-from-lead.
    leadIdPartialUniq: uniqueIndex('engagements_lead_id_partial_uniq')
      .on(t.leadId)
      .where(sql`${t.leadId} IS NOT NULL`),
    magicLinkTokenUniq: uniqueIndex('engagements_magic_link_token_uniq').on(
      t.magicLinkToken,
    ),
  }),
);

export const intakeSubmissions = pgTable(
  'intake_submissions',
  {
    id: serial('id').primaryKey(),
    engagementId: integer('engagement_id')
      .references(() => engagements.id, { onDelete: 'restrict' })
      .notNull(),
    toolsJson: jsonb('tools_json').notNull(),
    credentialsVaultRef: text('credentials_vault_ref'),
    goalsText: text('goals_text').notNull(),
    constraintsText: text('constraints_text'),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  },
  (t) => ({
    engagementIdIdx: index('intake_submissions_engagement_id_idx').on(
      t.engagementId,
    ),
  }),
);

export const automations = pgTable(
  'automations',
  {
    id: serial('id').primaryKey(),
    engagementId: integer('engagement_id')
      .references(() => engagements.id, { onDelete: 'restrict' })
      .notNull(),
    name: text('name').notNull(),
    description: text('description'),
    n8nWorkflowId: text('n8n_workflow_id'),
    status: automationStatus('status').default('draft').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    engagementIdIdx: index('automations_engagement_id_idx').on(t.engagementId),
  }),
);

export const runs = pgTable(
  'runs',
  {
    id: serial('id').primaryKey(),
    automationId: integer('automation_id')
      .references(() => automations.id, { onDelete: 'restrict' })
      .notNull(),
    startedAt: timestamp('started_at').notNull(),
    finishedAt: timestamp('finished_at'),
    status: runStatus('status').notNull(),
    outcomeJson: jsonb('outcome_json'),
    n8nExecutionId: text('n8n_execution_id'),
  },
  (t) => ({
    automationIdIdx: index('runs_automation_id_idx').on(t.automationId),
    startedAtIdx: index('runs_started_at_idx').on(t.startedAt),
    n8nExecutionIdUniq: uniqueIndex('runs_n8n_execution_id_uniq').on(
      t.n8nExecutionId,
    ),
  }),
);

export const outcomesMonthly = pgTable(
  'outcomes_monthly',
  {
    id: serial('id').primaryKey(),
    engagementId: integer('engagement_id')
      .references(() => engagements.id, { onDelete: 'restrict' })
      .notNull(),
    month: text('month').notNull(), // ISO YYYY-MM
    runsCount: integer('runs_count').default(0).notNull(),
    timeSavedMinutes: integer('time_saved_minutes').default(0).notNull(),
    dollarsInfluencedCents: integer('dollars_influenced_cents')
      .default(0)
      .notNull(),
    narrativeMd: text('narrative_md'),
  },
  (t) => ({
    engagementIdIdx: index('outcomes_monthly_engagement_id_idx').on(
      t.engagementId,
    ),
    engagementMonthUniq: uniqueIndex(
      'outcomes_monthly_engagement_month_uniq',
    ).on(t.engagementId, t.month),
  }),
);

export const webhookDeadLetter = pgTable(
  'webhook_dead_letter',
  {
    id: serial('id').primaryKey(),
    source: text('source').notNull(),
    payload: jsonb('payload').notNull(),
    errorMessage: text('error_message').notNull(),
    receivedAt: timestamp('received_at').defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at'),
    retryCount: integer('retry_count').default(0).notNull(),
  },
  (t) => ({
    sourceIdx: index('webhook_dead_letter_source_idx').on(t.source),
    receivedAtIdx: index('webhook_dead_letter_received_at_idx').on(
      t.receivedAt,
    ),
  }),
);

// Inferred row / insert types for downstream consumers
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Engagement = typeof engagements.$inferSelect;
export type NewEngagement = typeof engagements.$inferInsert;
export type IntakeSubmission = typeof intakeSubmissions.$inferSelect;
export type NewIntakeSubmission = typeof intakeSubmissions.$inferInsert;
export type Automation = typeof automations.$inferSelect;
export type NewAutomation = typeof automations.$inferInsert;
export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;
export type OutcomeMonthly = typeof outcomesMonthly.$inferSelect;
export type NewOutcomeMonthly = typeof outcomesMonthly.$inferInsert;
export type WebhookDeadLetter = typeof webhookDeadLetter.$inferSelect;
export type NewWebhookDeadLetter = typeof webhookDeadLetter.$inferInsert;
