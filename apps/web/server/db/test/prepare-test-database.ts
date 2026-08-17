/**
 * db:test:prepare
 * ensure avexa_test → migrate → guarded truncate → seed baseline
 *
 * Truncate uses a dedicated pg client so the Drizzle pool stays alive for seed.
 */

import { ensureTestDatabase } from "./ensure-test-database";
import { applyTestDatabaseEnv } from "./load-test-env";
import { resetTestData } from "./reset-test-database";

async function main(): Promise<void> {
  applyTestDatabaseEnv();
  await ensureTestDatabase();

  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
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

  const migrationsFolder = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../migrations",
  );

  try {
    await migrate(db, { migrationsFolder });
    console.log(`Test DB migrations applied from ${migrationsFolder}`);

    await resetTestData();

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
      `Test DB prepare complete. clients=${clients?.total ?? 0}, ` +
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

main().catch((error: unknown) => {
  console.error("db:test:prepare failed:", error);
  process.exitCode = 1;
});
