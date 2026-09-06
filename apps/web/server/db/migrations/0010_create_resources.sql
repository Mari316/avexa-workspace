CREATE TYPE "public"."resource_status" AS ENUM('Active', 'Inactive');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('Repository', 'API Docs', 'Environment', 'Test Management', 'Documentation', 'Other');--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"type" "resource_type" NOT NULL,
	"status" "resource_status" DEFAULT 'Active' NOT NULL,
	"project_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resources_project_id_idx" ON "resources" USING btree ("project_id");