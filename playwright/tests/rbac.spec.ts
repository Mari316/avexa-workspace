import { expect, test } from "@playwright/test";

import {
  ClientsApi,
  readCreatedClient,
} from "../api/clients.api.js";
import {
  ProjectsApi,
  readCreatedProject,
} from "../api/projects.api.js";
import {
  readApiError,
  readCreatedTask,
  TasksApi,
} from "../api/tasks.api.js";
import { buildClient } from "../data/client.factory.js";
import { buildProject } from "../data/project.factory.js";
import { buildTask } from "../data/task.factory.js";
import { cleanupTestData } from "../support/db/cleanup.js";

const SEED_CLIENT_ID = "11111111-1111-4111-8111-111111111111";
const SEED_PROJECT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

test.describe("Admin (Mari)", () => {
  test.use({ storageState: "./.auth/mari.json" });

  test("can create and delete a task", async ({ request }) => {
    const tasksApi = new TasksApi(request);
    const taskPayload = buildTask({
      projectId: SEED_PROJECT_ID,
      assignee: "Mari",
      priority: "Low",
    });

    let createdSlug: string | undefined;

    try {
      const createResponse = await tasksApi.createTask(taskPayload);
      expect(createResponse.status()).toBe(201);

      const created = await readCreatedTask(createResponse);
      expect(created.title).toBe(taskPayload.title);
      createdSlug = created.slug;

      const deleteResponse = await tasksApi.deleteTask(created.slug);
      expect(deleteResponse.status()).toBe(204);
      createdSlug = undefined;
    } finally {
      if (createdSlug) {
        await tasksApi.deleteTask(createdSlug);
      }
    }
  });

  test("rejects a task with an empty title", async ({ request }) => {
    const tasksApi = new TasksApi(request);
    const taskPayload = buildTask({
      projectId: SEED_PROJECT_ID,
      title: "",
    });

    const createResponse = await tasksApi.createTask(taskPayload);
    expect(createResponse.status()).toBe(400);

    const error = await readApiError(createResponse);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details?.some((detail) => detail.path === "title")).toBe(true);
  });

  test("can create and update a client", async ({ request }) => {
    const clientsApi = new ClientsApi(request);
    const clientPayload = buildClient();
    let createdSlug: string | undefined;

    try {
      const createResponse = await clientsApi.createClient(clientPayload);
      expect(createResponse.status()).toBe(201);

      const created = await readCreatedClient(createResponse);
      expect(created.name).toBe(clientPayload.name);
      createdSlug = created.slug;

      const nextStatus = created.status === "Active" ? "On Hold" : "Active";
      const updateResponse = await clientsApi.updateClient(created.slug, {
        status: nextStatus,
      });
      expect(updateResponse.status()).toBe(200);

      const getResponse = await clientsApi.getClient(created.slug);
      expect(getResponse.status()).toBe(200);
      const fetched = await readCreatedClient(getResponse);
      expect(fetched.status).toBe(nextStatus);
    } finally {
      if (createdSlug) {
        await cleanupTestData({ clientSlugs: [createdSlug] });
      }
    }
  });

  test("can create and update a project", async ({ request }) => {
    const clientsApi = new ClientsApi(request);
    const projectsApi = new ProjectsApi(request);
    let clientSlug: string | undefined;

    try {
      const createClientResponse = await clientsApi.createClient(buildClient());
      expect(createClientResponse.status()).toBe(201);
      const client = await readCreatedClient(createClientResponse);
      clientSlug = client.slug;

      const projectPayload = buildProject({ clientId: client.id });
      const createProjectResponse = await projectsApi.createProject(projectPayload);
      expect(createProjectResponse.status()).toBe(201);

      const created = await readCreatedProject(createProjectResponse);
      expect(created.name).toBe(projectPayload.name);
      expect(created.clientId).toBe(client.id);

      const nextStatus = created.status === "Active" ? "On Hold" : "Active";
      const updateResponse = await projectsApi.updateProject(created.slug, {
        status: nextStatus,
      });
      expect(updateResponse.status()).toBe(200);

      const getResponse = await projectsApi.getProject(created.slug);
      expect(getResponse.status()).toBe(200);
      const fetched = await readCreatedProject(getResponse);
      expect(fetched.status).toBe(nextStatus);
    } finally {
      if (clientSlug) {
        await cleanupTestData({ clientSlugs: [clientSlug] });
      }
    }
  });

  test("rejects a project with an empty name", async ({ request }) => {
    const projectsApi = new ProjectsApi(request);
    const projectPayload = buildProject({
      clientId: SEED_CLIENT_ID,
      name: "",
    });

    const createResponse = await projectsApi.createProject(projectPayload);
    expect(createResponse.status()).toBe(400);

    const error = await readApiError(createResponse);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details?.some((detail) => detail.path === "name")).toBe(true);
  });

  test("rejects a client with an empty name", async ({ request }) => {
    const clientsApi = new ClientsApi(request);
    const clientPayload = buildClient({ name: "" });

    const createResponse = await clientsApi.createClient(clientPayload);
    expect(createResponse.status()).toBe(400);

    const error = await readApiError(createResponse);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details?.some((detail) => detail.path === "name")).toBe(true);
  });
});

test.describe("QA Engineer (Chris)", () => {
  test.use({ storageState: "./.auth/chris.json" });

  test("can read clients but cannot create or update them", async ({
    request,
  }) => {
    const list = await request.get("/api/v1/clients");
    expect(list.status()).toBe(200);

    const clientsApi = new ClientsApi(request);
    const createResponse = await clientsApi.createClient(buildClient());
    expect(createResponse.status()).toBe(403);
    const createError = await readApiError(createResponse);
    expect(createError.code).toBe("FORBIDDEN");

    const patchResponse = await clientsApi.updateClient("pax8", {
      status: "On Hold",
    });
    expect(patchResponse.status()).toBe(403);
  });

  test("can read contacts but cannot create or update them", async ({
    request,
  }) => {
    const list = await request.get("/api/v1/contacts");
    expect(list.status()).toBe(200);

    const create = await request.post("/api/v1/contacts", {
      data: {
        firstName: "QA",
        lastName: `Forbidden ${Date.now()}`,
        clientId: "11111111-1111-4111-8111-111111111111",
        email: "qa.forbidden@example.test",
        role: "Tester",
        status: "Active",
      },
    });
    expect(create.status()).toBe(403);

    const patch = await request.patch("/api/v1/contacts/mitchell-lubbers", {
      data: { role: "Should Not Update" },
    });
    expect(patch.status()).toBe(403);
  });

  test("can create and delete a task", async ({ request }) => {
    const tasksApi = new TasksApi(request);
    const taskPayload = buildTask({
      projectId: SEED_PROJECT_ID,
      assignee: "Chris",
      priority: "Medium",
    });

    let createdSlug: string | undefined;

    try {
      const createResponse = await tasksApi.createTask(taskPayload);
      expect(createResponse.status()).toBe(201);

      const created = await readCreatedTask(createResponse);
      expect(created.title).toBe(taskPayload.title);
      createdSlug = created.slug;

      const patchResponse = await tasksApi.updateTask(created.slug, {
        status: "In Progress",
      });
      expect(patchResponse.status()).toBe(200);

      const deleteResponse = await tasksApi.deleteTask(created.slug);
      expect(deleteResponse.status()).toBe(204);
      createdSlug = undefined;
    } finally {
      if (createdSlug) {
        await tasksApi.deleteTask(createdSlug);
      }
    }
  });

  test("can create and update a project", async ({ request }) => {
    const projectsApi = new ProjectsApi(request);
    const projectPayload = buildProject({ clientId: SEED_CLIENT_ID });
    let projectSlug: string | undefined;

    try {
      const createResponse = await projectsApi.createProject(projectPayload);
      expect(createResponse.status()).toBe(201);

      const created = await readCreatedProject(createResponse);
      expect(created.name).toBe(projectPayload.name);
      projectSlug = created.slug;

      const nextStatus = created.status === "Active" ? "On Hold" : "Active";
      const updateResponse = await projectsApi.updateProject(created.slug, {
        status: nextStatus,
      });
      expect(updateResponse.status()).toBe(200);

      const getResponse = await projectsApi.getProject(created.slug);
      expect(getResponse.status()).toBe(200);
      const fetched = await readCreatedProject(getResponse);
      expect(fetched.status).toBe(nextStatus);
    } finally {
      if (projectSlug) {
        await cleanupTestData({ projectSlugs: [projectSlug] });
      }
    }
  });
});

test.describe("Viewer (Alex)", () => {
  test.use({ storageState: "./.auth/alex.json" });

  test("can read core domains but cannot mutate via API", async ({
    request,
  }) => {
    for (const path of [
      "/api/v1/clients",
      "/api/v1/contacts",
      "/api/v1/projects",
      "/api/v1/tasks",
    ]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
    }

    const delTask = await request.delete(
      "/api/v1/tasks/finish-regression-coverage",
    );
    expect(delTask.status()).toBe(403);
  });

  test("cannot create a client", async ({ request }) => {
    const clientsApi = new ClientsApi(request);
    const createResponse = await clientsApi.createClient(buildClient());
    expect(createResponse.status()).toBe(403);

    const error = await readApiError(createResponse);
    expect(error.code).toBe("FORBIDDEN");
  });

  test("cannot update a client", async ({ request }) => {
    const clientsApi = new ClientsApi(request);
    const updateResponse = await clientsApi.updateClient("pax8", {
      status: "On Hold",
    });
    expect(updateResponse.status()).toBe(403);

    const error = await readApiError(updateResponse);
    expect(error.code).toBe("FORBIDDEN");
  });

  test("cannot create a project", async ({ request }) => {
    const projectsApi = new ProjectsApi(request);
    const createResponse = await projectsApi.createProject(
      buildProject({ clientId: SEED_CLIENT_ID }),
    );
    expect(createResponse.status()).toBe(403);

    const error = await readApiError(createResponse);
    expect(error.code).toBe("FORBIDDEN");
  });

  test("cannot update a project", async ({ request }) => {
    const projectsApi = new ProjectsApi(request);
    const updateResponse = await projectsApi.updateProject("account-management", {
      status: "On Hold",
    });
    expect(updateResponse.status()).toBe(403);

    const error = await readApiError(updateResponse);
    expect(error.code).toBe("FORBIDDEN");
  });

  test("cannot create a task", async ({ request }) => {
    const tasksApi = new TasksApi(request);
    const taskPayload = buildTask({
      projectId: SEED_PROJECT_ID,
      assignee: "Alex",
    });

    const createResponse = await tasksApi.createTask(taskPayload);
    expect(createResponse.status()).toBe(403);

    const error = await readApiError(createResponse);
    expect(error.code).toBe("FORBIDDEN");
  });

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

test.describe("Anonymous", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("API requests still return 401", async ({ request }) => {
    const res = await request.get("/api/v1/clients");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("cannot create a task", async ({ request }) => {
    const tasksApi = new TasksApi(request);
    const taskPayload = buildTask({
      projectId: SEED_PROJECT_ID,
    });

    const createResponse = await tasksApi.createTask(taskPayload);
    expect(createResponse.status()).toBe(401);

    const error = await readApiError(createResponse);
    expect(error.code).toBe("UNAUTHORIZED");
  });

  test("cannot create a client", async ({ request }) => {
    const clientsApi = new ClientsApi(request);
    const createResponse = await clientsApi.createClient(buildClient());
    expect(createResponse.status()).toBe(401);

    const error = await readApiError(createResponse);
    expect(error.code).toBe("UNAUTHORIZED");
  });

  test("cannot create a project", async ({ request }) => {
    const projectsApi = new ProjectsApi(request);
    const createResponse = await projectsApi.createProject(
      buildProject({ clientId: SEED_CLIENT_ID }),
    );
    expect(createResponse.status()).toBe(401);

    const error = await readApiError(createResponse);
    expect(error.code).toBe("UNAUTHORIZED");
  });
});
