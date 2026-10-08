CREATE TABLE "visits" (
	"id" serial PRIMARY KEY,
	"owner_id" text NOT NULL,
	"owner_name" text DEFAULT '' NOT NULL,
	"owner_email" text DEFAULT '' NOT NULL,
	"branch" text DEFAULT '' NOT NULL,
	"branch_code" text DEFAULT '' NOT NULL,
	"visit_date" text DEFAULT '' NOT NULL,
	"auditor" text DEFAULT '' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "visits_owner_idx" ON "visits" ("owner_id");--> statement-breakpoint
CREATE INDEX "visits_created_idx" ON "visits" ("created_at");