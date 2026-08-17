import { expect, test } from "@playwright/test";

import { cleanupTestData } from "../support/db/cleanup";

test("user can navigate to Clients page", async ({ page }) => {
  await page.goto("/");

  const clientsLink = page.getByRole("link", { name: "Clients" });
  await clientsLink.click();
  await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
});

test("user can add a new client", async ({ page }) => {
  await page.goto("/clients");

  const clientName = `PW clients-add ${Date.now()}`;
  let createdSlug: string | undefined;

  try {
    await page.getByRole("button", { name: "Add Client" }).click();

    await page.getByLabel("Client Name").fill(clientName);
    await page.getByLabel("Status").selectOption({ label: "Active" });

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Add Client" }).click();

    const clientRow = page.getByRole("row").filter({ hasText: clientName });
    await expect(clientRow).toBeVisible();

    const href = await clientRow.getByRole("link", { name: /View/ }).getAttribute("href");
    createdSlug = href?.split("/").filter(Boolean).pop();
    expect(createdSlug).toBeTruthy();
  } finally {
    if (createdSlug) {
      await cleanupTestData({ clientSlugs: [createdSlug] });
    }
  }
});
