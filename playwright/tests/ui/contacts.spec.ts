import { buildContact } from "../../data/contact.factory.js";
import { expect, test } from "../../fixtures/test.js";

test.describe("Contacts UI", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("can create and edit a contact", async ({
      client,
      contactsPage,
      page,
    }) => {
      const payload = buildContact({ clientId: client.id });
      const displayName = `${payload.firstName} ${payload.lastName}`;
      const updatedRole = "Lead Tester";

      await contactsPage.goto();
      await expect(contactsPage.heading).toBeVisible();

      await contactsPage.createContact({
        firstName: payload.firstName,
        lastName: payload.lastName,
        clientName: client.name,
        email: payload.email,
        role: payload.role,
        status: payload.status,
      });

      const row = contactsPage.contactRow(displayName);
      await expect(row).toBeVisible();
      await expect(row).toContainText(payload.email);
      await expect(row).toContainText(client.name);
      await expect(row).toContainText(payload.role);
      await expect(row).toContainText(payload.status);

      await contactsPage.editContact(displayName, {
        role: updatedRole,
        status: "Inactive",
      });

      await expect(row).toContainText(updatedRole);
      await expect(row).toContainText("Inactive");

      const href = await contactsPage.contactViewLink(displayName).getAttribute("href");
      expect(href).toMatch(/^\/contacts\/[a-z0-9]+(?:-[a-z0-9]+)*$/);

      await contactsPage.contactViewLink(displayName).click();

      await expect(page).toHaveURL(href ?? /\/contacts\//);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(displayName);
      await expect(page.getByRole("link", { name: client.name })).toBeVisible();
      await expect(page.getByText(payload.email, { exact: true })).toBeVisible();
      await expect(page.getByText(updatedRole, { exact: true })).toBeVisible();
      await expect(page.getByText("Inactive", { exact: true }).first()).toBeVisible();
    });
  });
});
