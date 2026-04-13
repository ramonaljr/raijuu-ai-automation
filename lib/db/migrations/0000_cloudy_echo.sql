CREATE TYPE "public"."automation_status" AS ENUM('draft', 'live', 'paused', 'error');--> statement-breakpoint
CREATE TYPE "public"."engagement_status" AS ENUM('onboarding', 'active', 'paused', 'churned');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('success', 'failure', 'running');--> statement-breakpoint
CREATE TABLE "automations" (
	"id" serial PRIMARY KEY NOT NULL,
	"engagement_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"n8n_workflow_id" text,
	"status" "automation_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engagements" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"company_name" text NOT NULL,
	"status" "engagement_status" DEFAULT 'onboarding' NOT NULL,
	"magic_link_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"monthly_fee_cents" integer,
	"clerk_user_id" text
);
--> statement-breakpoint
CREATE TABLE "intake_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"engagement_id" integer NOT NULL,
	"tools_json" jsonb NOT NULL,
	"credentials_vault_ref" text,
	"goals_text" text NOT NULL,
	"constraints_text" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"industry" text NOT NULL,
	"situation_text" text NOT NULL,
	"demo_result_key" text,
	"ip_hash" text,
	"turnstile_verified" boolean DEFAULT false,
	"booked_at" timestamp,
	"source" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outcomes_monthly" (
	"id" serial PRIMARY KEY NOT NULL,
	"engagement_id" integer NOT NULL,
	"month" text NOT NULL,
	"runs_count" integer DEFAULT 0 NOT NULL,
	"time_saved_minutes" integer DEFAULT 0 NOT NULL,
	"dollars_influenced_cents" integer DEFAULT 0 NOT NULL,
	"narrative_md" text
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"automation_id" integer NOT NULL,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp,
	"status" "run_status" NOT NULL,
	"outcome_json" jsonb,
	"n8n_execution_id" text
);
--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_submissions" ADD CONSTRAINT "intake_submissions_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcomes_monthly" ADD CONSTRAINT "outcomes_monthly_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automations_engagement_id_idx" ON "automations" USING btree ("engagement_id");--> statement-breakpoint
CREATE INDEX "engagements_lead_id_idx" ON "engagements" USING btree ("lead_id");--> statement-breakpoint
CREATE UNIQUE INDEX "engagements_magic_link_token_uniq" ON "engagements" USING btree ("magic_link_token");--> statement-breakpoint
CREATE INDEX "intake_submissions_engagement_id_idx" ON "intake_submissions" USING btree ("engagement_id");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "outcomes_monthly_engagement_id_idx" ON "outcomes_monthly" USING btree ("engagement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "outcomes_monthly_engagement_month_uniq" ON "outcomes_monthly" USING btree ("engagement_id","month");--> statement-breakpoint
CREATE INDEX "runs_automation_id_idx" ON "runs" USING btree ("automation_id");--> statement-breakpoint
CREATE INDEX "runs_started_at_idx" ON "runs" USING btree ("started_at");