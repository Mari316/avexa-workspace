import { sql } from "drizzle-orm";
import { check, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Mirrors the `ClientStatus` union in `apps/web/lib/mockData.ts` so no value mapping is needed. */
export const clientStatusEnum = pgEnum("client_status", ["Active", "On Hold"]);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    status: clientStatusEnum("status").notNull().default("Active"),
    /**
     * Optional primary contact. The constraint enforcing it is declared in migration
     * `0002_add_client_primary_contact.sql` rather than here, for two reasons Drizzle
     * cannot express: it is a composite foreign key
     * `(primary_contact_id, id) -> contacts (id, client_id)` that keeps the chosen
     * contact inside this client, and it needs PostgreSQL's column-list
     * `ON DELETE SET NULL (primary_contact_id)` so a deleted contact can never null
     * this table's primary key. Declaring it here would also make clients and contacts
     * import each other at module-evaluation time.
     */
    primaryContactId: uuid("primary_contact_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Guarantees every slug stays usable verbatim in a /clients/[slug] URL.
    check("clients_slug_url_safe", sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  ],
);

export type ClientRow = typeof clients.$inferSelect;
export type NewClientRow = typeof clients.$inferInsert;
