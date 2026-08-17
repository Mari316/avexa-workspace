import { sql } from "drizzle-orm";

import { clients as clientSeedData, type Client } from "../../lib/mockData";
import { closeDatabase, db } from "../db";
import { clients, type NewClientRow } from "../db/schema";

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

function toClientRow(client: Client): NewClientRow {
  const id = SEED_CLIENT_IDS[client.slug];

  if (!id) {
    throw new Error(
      `Seed client "${client.slug}" has no fixed id. Add it to SEED_CLIENT_IDS to keep the seed deterministic.`,
    );
  }

  return {
    id,
    slug: client.slug,
    name: client.name,
    status: client.status,
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

async function main(): Promise<void> {
  await seedClientsTable();

  const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(clients);

  console.log(`Seed complete. clients table now holds ${row?.total ?? 0} row(s).`);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
