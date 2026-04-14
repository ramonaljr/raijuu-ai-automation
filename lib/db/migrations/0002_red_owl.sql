CREATE TABLE "webhook_dead_letter" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"payload" jsonb NOT NULL,
	"error_message" text NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"retry_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "webhook_dead_letter_source_idx" ON "webhook_dead_letter" USING btree ("source");--> statement-breakpoint
CREATE INDEX "webhook_dead_letter_received_at_idx" ON "webhook_dead_letter" USING btree ("received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "engagements_lead_id_partial_uniq" ON "engagements" USING btree ("lead_id") WHERE "engagements"."lead_id" IS NOT NULL;