import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { projects } from "./projects";

/** Mirrors the type options on the Add/Edit Resource form. */
export const resourceTypeEnum = pgEnum("resource_type", [
  "Repository",
  "API Docs",
  "Environment",
  "Test Management",
  "Documentation",
  "Other",
]);

/** Mirrors the Active / Inactive options on the Add/Edit Resource form. */
export const resourceStatusEnum = pgEnum("resource_status", [
  "Active",
  "Inactive",
]);

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    type: resourceTypeEnum("type").notNull(),
    status: resourceStatusEnum("status").notNull().default("Active"),
    projectId: uuid("project_id")
      .notNull()
      // Project DELETE does not exist; refuse rather than cascade-delete resources.
      .references(() => projects.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("resources_project_id_idx").on(table.projectId)],
);

export type ResourceRow = typeof resources.$inferSelect;
export type NewResourceRow = typeof resources.$inferInsert;
