import { applyTestDatabaseEnv } from "./load-test-env";

applyTestDatabaseEnv();

const { closeDatabase } = await import("../index");
const {
  seedAuthUsers,
  seedClientsTable,
  seedContactsTable,
  seedPrimaryContacts,
  seedProjectsTable,
  seedTasksTable,
} = await import("../../seed/seed");
const { sql } = await import("drizzle-orm");
const { db } = await import("../index");
const schema = await import("../schema");

async function main(): Promise<void> {
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

  console.log(
    `Test DB seed complete. clients=${clients?.total ?? 0}, ` +
      `contacts=${contacts?.total ?? 0}, projects=${projects?.total ?? 0}, ` +
      `tasks=${tasks?.total ?? 0}, users=${users?.total ?? 0}.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("db:test:seed failed:", error);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
