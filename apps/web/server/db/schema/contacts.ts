import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { clients } from "./clients";

/** Mirrors the `ContactStatus` union in `apps/web/lib/mockData.ts`. */
export const contactStatusEnum = pgEnum("contact_status", ["Active", "Inactive"]);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    clientId: uuid("client_id")
      .notNull()
      // Deleting a client that still has contacts is a decision nobody has made yet,
      // and no client DELETE exists, so the database refuses rather than guesses.
      .references(() => clients.id, { onDelete: "restrict" }),
    email: text("email").notNull(),
    role: text("role").notNull(),
    status: contactStatusEnum("status").notNull().default("Active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Guarantees every slug stays usable verbatim in a /contacts/[slug] URL.
    check("contacts_slug_url_safe", sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    // Redundant on its own (id is already unique) but required as the target of the
    // composite foreign key that keeps a client's primary contact inside that client.
    unique("contacts_id_client_id_unique").on(table.id, table.clientId),
    index("contacts_client_id_idx").on(table.clientId),
  ],
);

export type ContactRow = typeof contacts.$inferSelect;
export type NewContactRow = typeof contacts.$inferInsert;
