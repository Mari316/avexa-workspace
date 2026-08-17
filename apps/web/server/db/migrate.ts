import path from "node:path";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { closeDatabase, db } from "./index";

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

async function main(): Promise<void> {
  await migrate(db, { migrationsFolder });
  console.log(`Migrations applied from ${migrationsFolder}`);
}

main()
  .catch((error: unknown) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
