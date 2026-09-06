import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const AUDIT_EVENT_TYPES = [
  "CLIENT_CREATED",
  "CLIENT_UPDATED",
  "CONTACT_CREATED",
  "CONTACT_UPDATED",
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_DELETED",
  "NOTE_CREATED",
  "NOTE_UPDATED",
  "NOTE_DELETED",
] as const;

export const AUDIT_ENTITY_TYPES = [
  "client",
  "contact",
  "project",
  "task",
  "note",
] as const;

export const AUDIT_ACTIONS = ["created", "updated", "deleted"] as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditEventMetadata = {
  changedFields?: string[];
};

/**
 * Append-only snapshots of successful business mutations.
 * No FKs: history must survive domain and user deletes.
 */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: text("event_type").notNull(),
    entityType: text("entity_type").notNull(),
    action: text("action").notNull(),
    entityId: uuid("entity_id"),
    entitySlug: text("entity_slug").notNull(),
    entityLabel: text("entity_label").notNull(),
    actorUserId: text("actor_user_id").notNull(),
    actorName: text("actor_name").notNull(),
    metadata: jsonb("metadata").$type<AuditEventMetadata>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "audit_events_event_type_allowed",
      sql`${table.eventType} in (
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
      )`,
    ),
    check(
      "audit_events_entity_type_allowed",
      sql`${table.entityType} in ('client', 'contact', 'project', 'task', 'note')`,
    ),
    check(
      "audit_events_action_allowed",
      sql`${table.action} in ('created', 'updated', 'deleted')`,
    ),
    index("audit_events_created_at_idx").on(table.createdAt.desc()),
    index("audit_events_entity_type_action_idx").on(table.entityType, table.action),
    index("audit_events_entity_type_entity_slug_idx").on(
      table.entityType,
      table.entitySlug,
    ),
  ],
);

export type AuditEventRow = typeof auditEvents.$inferSelect;
export type NewAuditEventRow = typeof auditEvents.$inferInsert;
