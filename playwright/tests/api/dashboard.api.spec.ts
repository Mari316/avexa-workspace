import { readDashboard } from "../../api/dashboard.api.js";
import { readCreatedProject } from "../../api/projects.api.js";
import { readCreatedTask } from "../../api/tasks.api.js";
import { readApiError } from "../../api/errors.js";
import { buildProject } from "../../data/project.factory.js";
import { buildTask } from "../../data/task.factory.js";
import { expect, test } from "../../fixtures/test.js";

test.describe("Dashboard API", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("returns dashboard aggregates", async ({ dashboardApi }) => {
      const response = await dashboardApi.getDashboard();
      expect(response.status()).toBe(200);

      const dashboard = await readDashboard(response);
      expect(typeof dashboard.totals.clients).toBe("number");
      expect(typeof dashboard.totals.projects).toBe("number");
      expect(typeof dashboard.totals.tasks).toBe("number");
      expect(typeof dashboard.totals.notes).toBe("number");
      expect(typeof dashboard.totals.overdueTasks).toBe("number");
      expect(Array.isArray(dashboard.recentTasks)).toBe(true);
      expect(Array.isArray(dashboard.upcomingDueTasks)).toBe(true);
    });

    test("includes a newly created task in recentTasks", async ({
      client,
      dashboardApi,
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

      const dashboardResponse = await dashboardApi.getDashboard();
      expect(dashboardResponse.status()).toBe(200);
      const dashboard = await readDashboard(dashboardResponse);

      expect(
        dashboard.recentTasks.some((task) => task.title === taskPayload.title),
      ).toBe(true);
    });
  });

  test.describe("Viewer (Alex)", () => {
    test.use({ storageState: "./.auth/alex.json" });

    test("can read the dashboard", async ({ dashboardApi }) => {
      const response = await dashboardApi.getDashboard();
      expect(response.status()).toBe(200);
    });
  });

  test.describe("Anonymous", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("cannot read the dashboard", async ({ dashboardApi }) => {
      const response = await dashboardApi.getDashboard();
      expect(response.status()).toBe(401);

      const error = await readApiError(response);
      expect(error.code).toBe("UNAUTHORIZED");
    });
  });
});
