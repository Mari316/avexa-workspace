import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { projects } from "./projects";

/** Mirrors the Task status options used by the Tasks UI. */
export const taskStatusEnum = pgEnum("task_status", [
  "To Do",
  "In Progress",
  "Review",
  "Blocked",
  "Done",
]);

/** Mirrors the Task priority options used by the Tasks UI. */
export const taskPriorityEnum = pgEnum("task_priority", ["High", "Medium", "Low"]);

/**
 * Temporary display-name assignee until Users/auth exist. Values match the
 * Mari | Chris | Alex options on the Add/Edit Task forms.
 */
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    projectId: uuid("project_id")
      .notNull()
      // Project DELETE does not exist; refuse rather than cascade-delete tasks.
      .references(() => projects.id, { onDelete: "restrict" }),
    assignee: text("assignee").notNull(),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    priority: taskPriorityEnum("priority").notNull().default("Medium"),
    status: taskStatusEnum("status").notNull().default("To Do"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("tasks_slug_url_safe", sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    index("tasks_project_id_idx").on(table.projectId),
  ],
);

export type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;
