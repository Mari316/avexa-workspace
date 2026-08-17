import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "../apps/web");
const TEST_PORT = 3001;
const baseURL = `http://localhost:${TEST_PORT}`;

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

const testEnvFile = parseEnvFile(path.join(webRoot, ".env.test"));
const devEnvFile = parseEnvFile(path.join(webRoot, ".env"));

const testDatabaseUrl =
  process.env.DATABASE_URL?.includes("/avexa_test")
    ? process.env.DATABASE_URL
    : (testEnvFile.DATABASE_URL ??
      "postgresql://avexa:avexa@localhost:5432/avexa_test");

const betterAuthSecret =
  process.env.BETTER_AUTH_SECRET ??
  testEnvFile.BETTER_AUTH_SECRET ??
  devEnvFile.BETTER_AUTH_SECRET;

if (!betterAuthSecret) {
  throw new Error(
    "BETTER_AUTH_SECRET is required for Playwright. Set it in apps/web/.env.",
  );
}

const testEnv = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  ALLOW_TEST_DB_MUTATION: "true",
  BETTER_AUTH_SECRET: betterAuthSecret,
  BETTER_AUTH_URL: baseURL,
  AVEXA_PLAYWRIGHT: "1",
};

// Ensure Playwright support/db helpers see the test database.
process.env.DATABASE_URL = testDatabaseUrl;
process.env.ALLOW_TEST_DB_MUTATION = "true";
process.env.BETTER_AUTH_SECRET = betterAuthSecret;
process.env.BETTER_AUTH_URL = baseURL;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  globalSetup: "./global-setup.ts",
  timeout: 30 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL,
    headless: true,
    storageState: "./.auth/mari.json",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev:test -w web",
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: testEnv,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
