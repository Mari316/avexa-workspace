import { and, eq, sql } from "drizzle-orm";

import {
  clients as clientSeedData,
  contacts as contactSeedData,
  type Client,
  type Contact,
} from "../../lib/mockData";
import { closeDatabase, db } from "../db";
import { clients, contacts, type NewClientRow, type NewContactRow } from "../db/schema";

/**
 * Fixed ids keep seeded clients stable across resets and machines, so future
 * API/Playwright fixtures can reference a known client id.
 */
const SEED_CLIENT_IDS: Record<string, string> = {
  pax8: "11111111-1111-4111-8111-111111111111",
  cybertek: "22222222-2222-4222-8222-222222222222",
  orangehrm: "33333333-3333-4333-8333-333333333333",
  lemonade: "44444444-4444-4444-8444-444444444444",
};

/** Same reasoning as the client ids: a known contact id is addressable from tests. */
const SEED_CONTACT_IDS: Record<string, string> = {
  "mitchell-lubbers": "55555555-5555-4555-8555-555555555555",
  "jennifer-walsh": "66666666-6666-4666-8666-666666666666",
  "john-smith": "77777777-7777-4777-8777-777777777777",
  "emily-chen": "88888888-8888-4888-8888-888888888888",
  "sarah-lee": "99999999-9999-4999-8999-999999999999",
  "alex-brown": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
};

function seedClientId(slug: string): string {
  const id = SEED_CLIENT_IDS[slug];

  if (!id) {
    throw new Error(
      `Seed client "${slug}" has no fixed id. Add it to SEED_CLIENT_IDS to keep the seed deterministic.`,
    );
  }

  return id;
}

function seedContactId(slug: string): string {
  const id = SEED_CONTACT_IDS[slug];

  if (!id) {
    throw new Error(
      `Seed contact "${slug}" has no fixed id. Add it to SEED_CONTACT_IDS to keep the seed deterministic.`,
    );
  }

  return id;
}

function toClientRow(client: Client): NewClientRow {
  return {
    id: seedClientId(client.slug),
    slug: client.slug,
    name: client.name,
    status: client.status,
  };
}

/** Seed contacts still name their client; this resolves that name to the real key. */
function toContactRow(contact: Contact): NewContactRow {
  const owningClient = clientSeedData.find(
    (client) => client.name === contact.client,
  );

  if (!owningClient) {
    throw new Error(
      `Seed contact "${contact.slug}" references unknown client "${contact.client}".`,
    );
  }

  return {
    id: seedContactId(contact.slug),
    slug: contact.slug,
    firstName: contact.firstName,
    lastName: contact.lastName,
    clientId: seedClientId(owningClient.slug),
    email: contact.email,
    role: contact.role,
    status: contact.status,
  };
}

/**
 * Upserts on the client slug, so re-running never inserts duplicates. The `setWhere`
 * guard skips the UPDATE entirely when the stored row already matches the seed, which
 * keeps `updated_at` untouched on repeat runs.
 */
export async function seedClientsTable(): Promise<void> {
  for (const client of clientSeedData) {
    await db
      .insert(clients)
      .values(toClientRow(client))
      .onConflictDoUpdate({
        target: clients.slug,
        set: {
          name: sql`excluded.name`,
          status: sql`excluded.status`,
          updatedAt: sql`now()`,
        },
        setWhere: sql`clients.name IS DISTINCT FROM excluded.name
          OR clients.status IS DISTINCT FROM excluded.status`,
      });
  }
}

/** Same upsert-and-guard strategy as clients, keyed on the contact slug. */
export async function seedContactsTable(): Promise<void> {
  for (const contact of contactSeedData) {
    await db
      .insert(contacts)
      .values(toContactRow(contact))
      .onConflictDoUpdate({
        target: contacts.slug,
        set: {
          firstName: sql`excluded.first_name`,
          lastName: sql`excluded.last_name`,
          clientId: sql`excluded.client_id`,
          email: sql`excluded.email`,
          role: sql`excluded.role`,
          status: sql`excluded.status`,
          updatedAt: sql`now()`,
        },
        setWhere: sql`contacts.first_name IS DISTINCT FROM excluded.first_name
          OR contacts.last_name IS DISTINCT FROM excluded.last_name
          OR contacts.client_id IS DISTINCT FROM excluded.client_id
          OR contacts.email IS DISTINCT FROM excluded.email
          OR contacts.role IS DISTINCT FROM excluded.role
          OR contacts.status IS DISTINCT FROM excluded.status`,
      });
  }
}

/**
 * Must run after both tables exist: the composite foreign key only accepts a contact
 * that already belongs to the client. `updated_at` is deliberately left alone, so a
 * freshly seeded database keeps `created_at = updated_at` on every row.
 */
export async function seedPrimaryContacts(): Promise<void> {
  for (const client of clientSeedData) {
    if (!client.primaryContactSlug) {
      continue;
    }

    const clientId = seedClientId(client.slug);
    const contactId = seedContactId(client.primaryContactSlug);

    await db
      .update(clients)
      .set({ primaryContactId: contactId })
      .where(
        and(
          eq(clients.id, clientId),
          sql`${clients.primaryContactId} IS DISTINCT FROM ${contactId}::uuid`,
        ),
      );
  }
}

async function main(): Promise<void> {
  await seedClientsTable();
  await seedContactsTable();
  await seedPrimaryContacts();

  const [clientTotals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      withPrimaryContact: sql<number>`count(primary_contact_id)::int`,
    })
    .from(clients);
  const [contactTotals] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(contacts);

  console.log(
    `Seed complete. clients=${clientTotals?.total ?? 0} ` +
      `(with primary contact: ${clientTotals?.withPrimaryContact ?? 0}), ` +
      `contacts=${contactTotals?.total ?? 0}.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
