import { expect, test } from "../../fixtures/test.js";

test.describe("Settings UI", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("saves preferences, reloads them, and prefills create forms", async ({
      page,
      projectsPage,
      settingsApi,
      tasksPage,
    }) => {
      const reset = await settingsApi.updateSettings({
        defaultAssignee: null,
        defaultEnvironment: null,
      });
      expect(reset.status()).toBe(200);

      try {
        await page.goto("/settings");
        await expect(page.getByText("Loading settings…")).toHaveCount(0);
        await expect(
          page.getByRole("heading", { name: "Preferences" }),
        ).toBeVisible();

        await page.getByLabel("Default Assignee").selectOption("Chris");
        await page.getByLabel("Default Environment").selectOption("QA");
        await page.getByRole("button", { name: "Save Changes" }).click();
        await expect(
          page.getByRole("status").filter({ hasText: "Settings saved." }),
        ).toBeVisible();

        await page.reload();
        await expect(page.getByText("Loading settings…")).toHaveCount(0);
        await expect(page.getByLabel("Default Assignee")).toHaveValue("Chris");
        await expect(page.getByLabel("Default Environment")).toHaveValue("QA");

        await projectsPage.goto();
        await expect(projectsPage.heading).toBeVisible();
        await expect(projectsPage.addProjectButton).toBeEnabled();
        await projectsPage.openAddProject();
        await expect(
          page.getByRole("dialog", { name: "Add Project" }).getByLabel("Environment"),
        ).toHaveValue("QA");

        await tasksPage.goto();
        await expect(tasksPage.heading).toBeVisible();
        await expect(tasksPage.addTaskButton).toBeEnabled();
        await tasksPage.openAddTask();
        await expect(
          page.getByRole("dialog", { name: "Add Task" }).getByLabel("Assignee"),
        ).toHaveValue("Chris");
      } finally {
        const restore = await settingsApi.updateSettings({
          defaultAssignee: null,
          defaultEnvironment: null,
        });
        expect(restore.status()).toBe(200);
      }
    });
  });
});
