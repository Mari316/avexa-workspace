import { readCreatedProject } from "../../api/projects.api.js";
import { readCreatedTask } from "../../api/tasks.api.js";
import { buildProject } from "../../data/project.factory.js";
import { buildTask } from "../../data/task.factory.js";
import { expect, test } from "../../fixtures/test.js";
import { cleanupTestData } from "../../support/db/cleanup.js";

test.describe("Audit Log UI", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("shows a Created Task event from an API mutation", async ({
      client,
      page,
      projectsApi,
      tasksApi,
    }) => {
      const projectPayload = buildProject({ clientId: client.id });
      const createProjectResponse = await projectsApi.createProject(projectPayload);
      expect(createProjectResponse.status()).toBe(201);
      const project = await readCreatedProject(createProjectResponse);

      const taskPayload = buildTask({
        projectId: project.id,
        dueDate: "2026-12-31",
      });
      const createTaskResponse = await tasksApi.createTask(taskPayload);
      expect(createTaskResponse.status()).toBe(201);
      const created = await readCreatedTask(createTaskResponse);
      expect(created.title).toBe(taskPayload.title);

      try {
        await page.goto("/audit-log");
        await expect(
          page.getByRole("heading", { name: "Audit Log", exact: true }),
        ).toBeVisible();
        await expect(page.getByText("Loading audit log…")).toHaveCount(0);
        await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);

        await page.getByLabel("Search audit log").fill(created.title);
        const eventRow = page.getByRole("row", { name: created.title });
        await expect(eventRow).toBeVisible();
        await expect(eventRow).toContainText("Mari Astapova");
        await expect(eventRow).toContainText("Created");
        await expect(eventRow).toContainText("Task");
        await expect(eventRow).toContainText(created.title);

        await page.getByLabel("Filter by action").selectOption("Created");
        await page.getByLabel("Filter by entity").selectOption("Task");
        await expect(page.getByText("Loading audit log…")).toHaveCount(0);
        await expect(eventRow).toBeVisible();
        await expect(eventRow).toContainText("Created");
        await expect(eventRow).toContainText("Task");
        await expect(eventRow).toContainText(created.title);
      } finally {
        await cleanupTestData({
          auditEntities: [{ entityType: "task", entitySlug: created.slug }],
        });
      }
    });
  });
});
