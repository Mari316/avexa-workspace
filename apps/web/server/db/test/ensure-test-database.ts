import path from "node:path";
import { pathToFileURL } from "node:url";

import { Client } from "pg";

import {
  TEST_DATABASE_NAME,
  parseDatabaseUrl,
} from "./database-url";
import { applyTestDatabaseEnv } from "./load-test-env";

/**
 * Idempotently creates the avexa_test database in the existing Postgres cluster.
 */
export async function ensureTestDatabase(): Promise<void> {
  applyTestDatabaseEnv();

  const parsed = parseDatabaseUrl(process.env.DATABASE_URL!);
  const client = new Client({ connectionString: parsed.maintenanceUrl });

  await client.connect();

  try {
    const existing = await client.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
      [TEST_DATABASE_NAME],
    );

    if (existing.rows[0]?.exists) {
      console.log(`Database "${TEST_DATABASE_NAME}" already exists.`);
      return;
    }

    await client.query(`CREATE DATABASE ${TEST_DATABASE_NAME}`);
    console.log(`Created database "${TEST_DATABASE_NAME}".`);
  } finally {
    await client.end();
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  ensureTestDatabase().catch((error: unknown) => {
    console.error("db:test:ensure failed:", error);
    process.exitCode = 1;
  });
}
