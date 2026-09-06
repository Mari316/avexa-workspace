import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { projects } from "./projects";

/** Mirrors the category options on the Add/Edit Note form. */
export const noteCategoryEnum = pgEnum("note_category", [
  "Testing",
  "Automation",
  "Investigation",
  "Bug",
  "General",
]);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    category: noteCategoryEnum("category").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    projectId: uuid("project_id")
      .notNull()
      // Project DELETE does not exist; refuse rather than cascade-delete notes.
      .references(() => projects.id, { onDelete: "restrict" }),
    author: text("author").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("notes_slug_url_safe", sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    index("notes_project_id_idx").on(table.projectId),
  ],
);

export type NoteRow = typeof notes.$inferSelect;
export type NewNoteRow = typeof notes.$inferInsert;
