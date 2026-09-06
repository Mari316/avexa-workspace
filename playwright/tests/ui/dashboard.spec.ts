import { readCreatedProject } from "../../api/projects.api.js";
import { readCreatedTask } from "../../api/tasks.api.js";
import { buildProject } from "../../data/project.factory.js";
import { buildTask } from "../../data/task.factory.js";
import { expect, test } from "../../fixtures/test.js";

test.describe("Dashboard UI", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("shows an API-created task in Recent Tasks", async ({
      client,
      clientsPage,
      page,
      projectsApi,
      taskDetailsPage,
      tasksApi,
    }) => {
      // First next-dev compile of /tasks/[slug] under parallel workers can
      // exceed the default 30s test budget after dashboard setup + click.
      test.setTimeout(60_000);

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

      await page.goto("/");
      await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
      await expect(page.getByText("Loading dashboard…")).toHaveCount(0);
      await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);

      await expect(
        page.getByRole("heading", { name: "Recent Tasks", exact: true }),
      ).toBeVisible();

      const recentTaskLink = page.getByRole("main").getByRole("link", {
        name: taskPayload.title,
      });
      await expect(recentTaskLink).toBeVisible();
      await expect(recentTaskLink).toHaveAttribute(
        "href",
        `/tasks/${created.slug}`,
      );

      await recentTaskLink.click();
      // Soft nav URL stays on / until first next-dev compile of /tasks/[slug].
      await expect(page).toHaveURL(new RegExp(`/tasks/${created.slug}/?$`), {
        timeout: 45_000,
      });
      await expect(taskDetailsPage.heading).toHaveText(taskPayload.title);

      await page.goto("/");
      await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
      await expect(page.getByText("Loading dashboard…")).toHaveCount(0);

      const clientsCard = page.getByRole("main").getByRole("link", {
        name: "Clients",
      });
      await expect(clientsCard).toHaveAttribute("href", "/clients");
      await clientsCard.click();
      await expect(page).toHaveURL(/\/clients\/?$/);
      await expect(clientsPage.heading).toBeVisible();
    });
  });
});
