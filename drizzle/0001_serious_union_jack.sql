CREATE TABLE "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "subscriber_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "attempt" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "last_error" text;--> statement-breakpoint
ALTER TABLE "deliveries" DROP COLUMN "url";--> statement-breakpoint
ALTER TABLE "deliveries" DROP COLUMN "attempts";