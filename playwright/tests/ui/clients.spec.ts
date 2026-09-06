import { expect, test } from "../../fixtures/test.js";
import { cleanupTestData } from "../../support/db/cleanup.js";

test("user can navigate to Clients page", async ({ clientsPage }) => {
  await clientsPage.openFromHome();
  await expect(clientsPage.heading).toBeVisible();
});

test("user can add a new client", async ({ clientsPage }) => {
  await clientsPage.goto();

  const clientName = `PW clients-add ${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  try {
    await clientsPage.createClient({ name: clientName, status: "Active" });
    await expect(clientsPage.clientRow(clientName)).toBeVisible();

    const href = await clientsPage.clientViewLink(clientName).getAttribute("href");
    expect(href).toMatch(/^\/clients\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
  } finally {
    await cleanupTestData({ clientNames: [clientName] });
  }
});
