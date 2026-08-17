import { chromium, type FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PERSONAS = [
  {
    email: "mari@avexa.test",
    password: "Password123!",
    file: "mari.json",
  },
  {
    email: "chris@avexa.test",
    password: "Password123!",
    file: "chris.json",
  },
  {
    email: "alex@avexa.test",
    password: "Password123!",
    file: "alex.json",
  },
] as const;

/**
 * Logs in once per demo persona and saves Playwright storageState files.
 * Uses the real /login UI so Better Auth sets its HttpOnly session cookie.
 * Generated cookies are gitignored under playwright/.auth/.
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";
  const authDir = path.join(__dirname, ".auth");

  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();

  for (const persona of PERSONAS) {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    await page.goto("/login");
    await page.getByLabel("Email").fill(persona.email);
    await page.getByLabel("Password").fill(persona.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"));

    await context.storageState({ path: path.join(authDir, persona.file) });
    await context.close();
  }

  await browser.close();
}

export default globalSetup;
