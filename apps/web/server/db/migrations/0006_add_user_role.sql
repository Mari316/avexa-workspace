ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'viewer' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_valid" CHECK ("role" IN ('admin', 'qa_engineer', 'viewer'));
