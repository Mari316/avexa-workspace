import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { clients } from "./clients";

/** Mirrors the Project status options used by the Projects UI. */
export const projectStatusEnum = pgEnum("project_status", ["Active", "On Hold"]);

/** Mirrors the Environment options on the Add Project form. */
export const projectEnvironmentEnum = pgEnum("project_environment", [
  "Development",
  "QA",
  "Staging",
  "Production",
  "Demo",
]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    clientId: uuid("client_id")
      .notNull()
      // Client DELETE does not exist yet; refuse rather than invent cascade behavior.
      .references(() => clients.id, { onDelete: "restrict" }),
    environment: projectEnvironmentEnum("environment").notNull(),
    status: projectStatusEnum("status").notNull().default("Active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("projects_slug_url_safe", sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    index("projects_client_id_idx").on(table.clientId),
  ],
);

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
