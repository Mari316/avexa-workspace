import { chromium, type FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Logs in once as the Mari demo user and saves Playwright storageState.
 * Uses the real /login UI so Better Auth sets its HttpOnly session cookie.
 * Generated cookies are gitignored under playwright/.auth/.
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";
  const authDir = path.join(__dirname, ".auth");
  const authFile = path.join(authDir, "mari.json");

  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await page.goto("/login");
  await page.getByLabel("Email").fill("mari@avexa.test");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));

  await context.storageState({ path: authFile });
  await browser.close();
}

export default globalSetup;
