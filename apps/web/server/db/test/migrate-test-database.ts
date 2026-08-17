import { applyTestDatabaseEnv } from "./load-test-env";

applyTestDatabaseEnv();

const { migrate } = await import("drizzle-orm/node-postgres/migrator");
const path = await import("node:path");
const { fileURLToPath } = await import("node:url");
const { closeDatabase, db } = await import("../index");

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../migrations",
);

async function main(): Promise<void> {
  await migrate(db, { migrationsFolder });
  console.log(`Test DB migrations applied from ${migrationsFolder}`);
}

main()
  .catch((error: unknown) => {
    console.error("db:test:migrate failed:", error);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
