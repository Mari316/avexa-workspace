/**
 * Resets mutable application/auth data on avexa_test, then reseeds baseline.
 * Does NOT touch drizzle migration history (__drizzle_migrations).
 */

import path from "node:path";
import { pathToFileURL } from "node:url";

import { Client } from "pg";

import { assertTestDatabase } from "./assert-test-database";
import { applyTestDatabaseEnv } from "./load-test-env";

/** Application + Better Auth data tables. Migration journal is intentionally omitted. */
const TRUNCATE_TABLES = [
  "tasks",
  "projects",
  "contacts",
  "clients",
  "session",
  "account",
  "verification",
  '"user"',
] as const;

export async function resetTestData(): Promise<void> {
  applyTestDatabaseEnv();
  assertTestDatabase();

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(
      `TRUNCATE TABLE ${TRUNCATE_TABLES.join(", ")} RESTART IDENTITY CASCADE`,
    );
    console.log("Truncated test application/auth tables.");
  } finally {
    await client.end();
  }
}

export async function resetTestDatabase(): Promise<void> {
  await resetTestData();

  // Open Drizzle only after truncate so this CLI process has a single live pool.
  const { closeDatabase, db } = await import("../index");
  const { sql } = await import("drizzle-orm");
  const schema = await import("../schema");
  const {
    seedAuthUsers,
    seedClientsTable,
    seedContactsTable,
    seedPrimaryContacts,
    seedProjectsTable,
    seedTasksTable,
  } = await import("../../seed/seed");

  try {
    await seedClientsTable();
    await seedContactsTable();
    await seedPrimaryContacts();
    await seedProjectsTable();
    await seedTasksTable();
    await seedAuthUsers();

    const [clients] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.clients);
    const [contacts] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.contacts);
    const [projects] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.projects);
    const [tasks] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.tasks);
    const [users] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.user);
    const roles = await db
      .select({ email: schema.user.email, role: schema.user.role })
      .from(schema.user);

    console.log(
      `Test DB reset+seed complete. clients=${clients?.total ?? 0}, ` +
        `contacts=${contacts?.total ?? 0}, projects=${projects?.total ?? 0}, ` +
        `tasks=${tasks?.total ?? 0}, users=${users?.total ?? 0}.`,
    );
    console.log(
      `Roles: ${roles.map((row) => `${row.email}=${row.role}`).join(", ")}`,
    );
  } finally {
    await closeDatabase();
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  resetTestDatabase().catch((error: unknown) => {
    console.error("db:test:reset failed:", error);
    process.exitCode = 1;
  });
}
