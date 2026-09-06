import { expect, test } from "@playwright/test";

test.describe("Viewer (Alex)", () => {
  test.use({ storageState: "./.auth/alex.json" });

  test("hides representative mutation controls in the UI", async ({ page }) => {
    await page.goto("/clients");
    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Client" }),
    ).toHaveCount(0);

    await page.goto("/projects");
    await expect(
      page.getByRole("button", { name: "Add Project" }),
    ).toHaveCount(0);

    await page.goto("/tasks");
    await expect(page.getByRole("button", { name: "Add Task" })).toHaveCount(0);

    await page.goto("/notes");
    await expect(page.getByRole("button", { name: "Add Note" })).toHaveCount(0);

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
