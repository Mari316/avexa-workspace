CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"action" text NOT NULL,
	"entity_id" uuid,
	"entity_slug" text NOT NULL,
	"entity_label" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"actor_name" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_events_event_type_allowed" CHECK ("audit_events"."event_type" in (
        'CLIENT_CREATED',
        'CLIENT_UPDATED',
        'CONTACT_CREATED',
        'CONTACT_UPDATED',
        'PROJECT_CREATED',
        'PROJECT_UPDATED',
        'TASK_CREATED',
        'TASK_UPDATED',
        'TASK_DELETED',
        'NOTE_CREATED',
        'NOTE_UPDATED',
        'NOTE_DELETED'
      )),
	CONSTRAINT "audit_events_entity_type_allowed" CHECK ("audit_events"."entity_type" in ('client', 'contact', 'project', 'task', 'note')),
	CONSTRAINT "audit_events_action_allowed" CHECK ("audit_events"."action" in ('created', 'updated', 'deleted'))
);
--> statement-breakpoint
CREATE INDEX "audit_events_created_at_idx" ON "audit_events" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_events_entity_type_action_idx" ON "audit_events" USING btree ("entity_type","action");--> statement-breakpoint
CREATE INDEX "audit_events_entity_type_entity_slug_idx" ON "audit_events" USING btree ("entity_type","entity_slug");
