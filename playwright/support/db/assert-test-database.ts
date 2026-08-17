import {
  DEV_DATABASE_NAME,
  isLocalDatabaseHost,
  parseDatabaseUrl,
  TEST_DATABASE_NAME,
} from "../../../apps/web/server/db/test/database-url";

export type AssertTestDatabaseOptions = {
  requireLocalHost?: boolean;
};

/**
 * Hard guard for Playwright DB helpers. Mirrors apps/web assertTestDatabase.
 */
export function assertTestDatabase(
  options: AssertTestDatabaseOptions = {},
): void {
  const { requireLocalHost = true } = options;
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "assertTestDatabase: DATABASE_URL is not set. Expected .../avexa_test.",
    );
  }

  if (process.env.ALLOW_TEST_DB_MUTATION !== "true") {
    throw new Error(
      'assertTestDatabase: ALLOW_TEST_DB_MUTATION must be exactly "true".',
    );
  }

  const parsed = parseDatabaseUrl(databaseUrl);

  if (parsed.databaseName === DEV_DATABASE_NAME) {
    throw new Error(
      `assertTestDatabase: refusing to mutate development database "${DEV_DATABASE_NAME}".`,
    );
  }

  if (parsed.databaseName !== TEST_DATABASE_NAME) {
    throw new Error(
      `assertTestDatabase: DATABASE_URL database must be "${TEST_DATABASE_NAME}" (got "${parsed.databaseName}").`,
    );
  }

  if (requireLocalHost && !isLocalDatabaseHost(parsed.host)) {
    throw new Error(
      `assertTestDatabase: refusing non-local host "${parsed.host}".`,
    );
  }
}
