/**
 * Shared helpers for Avexa test-database tooling.
 * Destructive operations must call assertTestDatabase() first.
 */

export const TEST_DATABASE_NAME = "avexa_test";
export const DEV_DATABASE_NAME = "avexa";

export const DEFAULT_TEST_DATABASE_URL =
  "postgresql://avexa:avexa@localhost:5432/avexa_test";

export type ParsedDatabaseUrl = {
  href: string;
  databaseName: string;
  host: string;
  /** Connection string pointing at a maintenance DB used to CREATE DATABASE. */
  maintenanceUrl: string;
};

export function parseDatabaseUrl(connectionString: string): ParsedDatabaseUrl {
  let url: URL;

  try {
    url = new URL(connectionString);
  } catch {
    throw new Error(`DATABASE_URL is not a valid URL: ${connectionString}`);
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));

  if (!databaseName) {
    throw new Error("DATABASE_URL must include a database name in the path.");
  }

  const maintenance = new URL(connectionString);
  // Connect to the existing compose default DB to issue CREATE DATABASE.
  maintenance.pathname = `/${DEV_DATABASE_NAME}`;

  return {
    href: connectionString,
    databaseName,
    host: url.hostname,
    maintenanceUrl: maintenance.toString(),
  };
}

export function isLocalDatabaseHost(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0"
  );
}
