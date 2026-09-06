import { expect, test } from "../../fixtures/test.js";
import { cleanupTestData } from "../../support/db/cleanup.js";

test("user can navigate to Clients page", async ({ clientsPage }) => {
  await clientsPage.openFromHome();
  await expect(clientsPage.heading).toBeVisible();
});

test("user can add a new client", async ({ clientsPage }) => {
  await clientsPage.goto();

  const clientName = `PW clients-add ${Date.now()}`;
  let createdSlug: string | undefined;

  try {
    await clientsPage.createClient({ name: clientName, status: "Active" });
    await expect(clientsPage.clientRow(clientName)).toBeVisible();

    const href = await clientsPage.clientViewLink(clientName).getAttribute("href");
    createdSlug = href?.split("/").filter(Boolean).pop();
    expect(createdSlug).toBeTruthy();
  } finally {
    if (createdSlug) {
      await cleanupTestData({ clientSlugs: [createdSlug] });
    }
  }
});
