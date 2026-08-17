import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

function readDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy apps/web/.env.example to apps/web/.env and start PostgreSQL with `npm run db:up`.",
    );
  }

  return url;
}

/**
 * Next.js dev mode and `tsx --watch` re-evaluate modules on every change, which would
 * leak a new connection pool each time. Caching the pool on globalThis keeps exactly one
 * pool per process.
 */
const globalForDb = globalThis as typeof globalThis & {
  avexaPgPool?: Pool;
};

function getPool(): Pool {
  if (!globalForDb.avexaPgPool) {
    globalForDb.avexaPgPool = new Pool({
      connectionString: readDatabaseUrl(),
      max: 10,
    });
  }

  return globalForDb.avexaPgPool;
}

export const pool = getPool();

export const db = drizzle(pool, { schema });

export type Database = typeof db;

/** Only for short-lived processes (migrations, seed, tests) so Node can exit. */
export async function closeDatabase(): Promise<void> {
  const activePool = globalForDb.avexaPgPool;

  if (!activePool) {
    return;
  }

  globalForDb.avexaPgPool = undefined;
  await activePool.end();
}
