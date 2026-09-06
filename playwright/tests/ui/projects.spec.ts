import { expect, test } from "../../fixtures/test.js";

test.describe("Projects UI", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("can create a project and open its detail page", async ({
      client,
      projectsPage,
      page,
    }) => {
      const projectName = `PW project ${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

      await projectsPage.goto();
      await expect(projectsPage.heading).toBeVisible();

      await projectsPage.createProject({
        name: projectName,
        clientName: client.name,
        environment: "QA",
        status: "Active",
      });

      const row = projectsPage.projectRow(projectName);
      await expect(row).toBeVisible();
      await expect(row).toContainText(client.name);
      await expect(row).toContainText("QA");
      await expect(row).toContainText("Active");

      const href = await projectsPage.projectViewLink(projectName).getAttribute("href");
      expect(href).toMatch(/^\/projects\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
      if (!href) {
        throw new Error("Project View href is missing");
      }
      await page.goto(href);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(projectName);
      await expect(page.getByRole("link", { name: client.name })).toBeVisible();
      await expect(page.getByText("QA", { exact: true })).toBeVisible();
      await expect(page.getByText("Active", { exact: true }).first()).toBeVisible();
    });
  });
});
