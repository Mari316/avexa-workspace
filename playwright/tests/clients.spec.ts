import { test, expect } from "@playwright/test";


test("user can navigate to Clients page", async ({ page }) => {
    await page.goto("/");

    const clientsLink = page.getByRole("link", { name: "Clients" });
    await clientsLink.click();
    await expect(
        page.getByRole("heading", { name: "Clients" })
      ).toBeVisible();
});
test("user can add a new client", async ({ page }) => {
    await page.goto("/clients");
  
    const addClientButton = page.getByRole("button", {
      name: "Add Client",
    });
  
    await addClientButton.click();
  
    const clientName = `Avexa Test Client ${Date.now()}`;

    const nameInput = page.getByLabel("Client Name");
    await nameInput.fill(clientName);
    const statusSelect = page.getByLabel("Status");
await statusSelect.selectOption({ label: "Active" });
const dialog = page.getByRole("dialog");

const submitButton = dialog.getByRole("button", {
  name: "Add Client",
});

await submitButton.click();
const clientRow = page
  .getByRole("row")
  .filter({ hasText: clientName });

await expect(clientRow).toBeVisible();
  });
    