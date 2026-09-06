import { expect, test } from "../../fixtures/test.js";

test.describe("Viewer (Alex)", () => {
  test.use({ storageState: "./.auth/alex.json" });

  test("hides representative mutation controls in the UI", async ({
    page,
    clientsPage,
    contactsPage,
  }) => {
    await clientsPage.goto();
    await expect(clientsPage.heading).toBeVisible();
    await expect(clientsPage.addClientButton).toHaveCount(0);

    await contactsPage.goto();
    await expect(contactsPage.heading).toBeVisible();
    await expect(contactsPage.addContactButton).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);

    await page.goto("/projects");
    await expect(
      page.getByRole("button", { name: "Add Project" }),
    ).toHaveCount(0);

    await page.goto("/tasks");
    await expect(page.getByRole("button", { name: "Add Task" })).toHaveCount(0);

    await page.goto("/notes");
    await expect(page.getByRole("button", { name: "Add Note" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);

    await page.goto("/resources");
    await expect(
      page.getByRole("button", { name: "Add Resource" }),
    ).toHaveCount(0);

    await page.goto("/team");
    await expect(
      page.getByRole("button", { name: "Add Team Member" }),
    ).toHaveCount(0);
  });
});
