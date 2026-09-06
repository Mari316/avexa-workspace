import { readCreatedProject } from "../../api/projects.api.js";
import { buildProject } from "../../data/project.factory.js";
import { expect, test } from "../../fixtures/test.js";

test.describe("Tasks UI", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("can create, edit, and delete a task", async ({
      client,
      projectsApi,
      tasksPage,
      taskDetailsPage,
      page,
    }) => {
      const projectPayload = buildProject({ clientId: client.id });
      const createProjectResponse = await projectsApi.createProject(projectPayload);
      expect(createProjectResponse.status()).toBe(201);
      const project = await readCreatedProject(createProjectResponse);

      const title = `PW task ${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      const updatedTitle = `${title} edited`;

      await tasksPage.goto();
      await expect(tasksPage.heading).toBeVisible();

      await tasksPage.createTask({
        title,
        clientName: client.name,
        projectName: project.name,
        assignee: "Mari",
        dueDate: "2026-12-31",
        priority: "High",
        status: "To Do",
      });

      await expect(tasksPage.taskRow(title)).toBeVisible();
      await expect(tasksPage.taskRow(title)).toContainText(project.name);
      await expect(tasksPage.taskRow(title)).toContainText(client.name);

      const viewHref = await tasksPage.taskViewLink(title).getAttribute("href");
      expect(viewHref).toMatch(/^\/tasks\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
      if (!viewHref) {
        throw new Error("Task View href is missing");
      }
      await page.goto(viewHref);
      await expect(taskDetailsPage.heading).toHaveText(title);

      await taskDetailsPage.editTask({
        title: updatedTitle,
        status: "In Progress",
      });

      await expect(taskDetailsPage.heading).toHaveText(updatedTitle);
      await expect(page.getByText("In Progress", { exact: true }).first()).toBeVisible();

      await taskDetailsPage.deleteTask();

      await expect(page).toHaveURL(/\/tasks\/?$/);
      await expect(tasksPage.taskRow(updatedTitle)).toHaveCount(0);
    });
  });
});
