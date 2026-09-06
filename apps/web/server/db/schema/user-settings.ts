import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

/**
 * Per-user create-form defaults. Live current state — FK + cascade is correct
 * (unlike append-only audit_events).
 */
export const userSettings = pgTable(
  "user_settings",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    defaultAssignee: text("default_assignee"),
    defaultEnvironment: text("default_environment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "user_settings_default_assignee_valid",
      sql`${table.defaultAssignee} is null or ${table.defaultAssignee} in ('Mari', 'Chris', 'Alex')`,
    ),
    check(
      "user_settings_default_environment_valid",
      sql`${table.defaultEnvironment} is null or ${table.defaultEnvironment} in ('Development', 'QA', 'Staging', 'Production', 'Demo')`,
    ),
  ],
);

export type UserSettingsRow = typeof userSettings.$inferSelect;
export type NewUserSettingsRow = typeof userSettings.$inferInsert;
