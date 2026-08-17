import {
  DEV_DATABASE_NAME,
  isLocalDatabaseHost,
  parseDatabaseUrl,
  TEST_DATABASE_NAME,
} from "./database-url";

export type AssertTestDatabaseOptions = {
  /**
   * When true (default for local CLI), reject hosts that are not localhost-like.
   * Set false in future CI if the Postgres service hostname is not local.
   */
  requireLocalHost?: boolean;
};

/**
 * Hard guard for any destructive test DB operation.
 * Never allows mutation against the development database `avexa`.
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
      `assertTestDatabase: refusing non-local host "${parsed.host}". ` +
        "For CI service hosts, call assertTestDatabase({ requireLocalHost: false }).",
    );
  }
}
