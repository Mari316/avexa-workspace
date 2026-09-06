CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"default_assignee" text,
	"default_environment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_default_assignee_valid" CHECK ("user_settings"."default_assignee" is null or "user_settings"."default_assignee" in ('Mari', 'Chris', 'Alex')),
	CONSTRAINT "user_settings_default_environment_valid" CHECK ("user_settings"."default_environment" is null or "user_settings"."default_environment" in ('Development', 'QA', 'Staging', 'Production', 'Demo'))
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;