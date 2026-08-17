import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_TEST_DATABASE_URL,
  TEST_DATABASE_NAME,
  parseDatabaseUrl,
} from "./database-url";

const webRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values: Record<string, string> = {};

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");

    if (eq <= 0) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

/**
 * Loads test-database environment for CLI scripts.
 * Prefers apps/web/.env.test, falls back to safe local defaults, and borrows
 * BETTER_AUTH_SECRET from apps/web/.env when missing.
 */
export function applyTestDatabaseEnv(): void {
  const testEnv = parseEnvFile(path.join(webRoot, ".env.test"));
  const devEnv = parseEnvFile(path.join(webRoot, ".env"));

  for (const [key, value] of Object.entries(testEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = DEFAULT_TEST_DATABASE_URL;
  }

  if (!process.env.ALLOW_TEST_DB_MUTATION) {
    process.env.ALLOW_TEST_DB_MUTATION = "true";
  }

  if (!process.env.BETTER_AUTH_SECRET && devEnv.BETTER_AUTH_SECRET) {
    process.env.BETTER_AUTH_SECRET = devEnv.BETTER_AUTH_SECRET;
  }

  if (!process.env.BETTER_AUTH_URL) {
    process.env.BETTER_AUTH_URL =
      testEnv.BETTER_AUTH_URL ?? "http://localhost:3001";
  }

  const parsed = parseDatabaseUrl(process.env.DATABASE_URL);

  if (parsed.databaseName !== TEST_DATABASE_NAME) {
    throw new Error(
      `Test tooling DATABASE_URL must target "${TEST_DATABASE_NAME}" (got "${parsed.databaseName}").`,
    );
  }
}

export function getWebRoot(): string {
  return webRoot;
}
