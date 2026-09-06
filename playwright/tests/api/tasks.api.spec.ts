import { readApiError } from "../../api/errors.js";
import { readCreatedTask } from "../../api/tasks.api.js";
import { buildTask } from "../../data/task.factory.js";
import { expect, test } from "../../fixtures/test.js";

const SEED_PROJECT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

test.describe("Tasks API", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("can create and delete a task", async ({ tasksApi }) => {
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

    test("rejects a task with an empty title", async ({ tasksApi }) => {
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
  });

  test.describe("QA Engineer (Chris)", () => {
    test.use({ storageState: "./.auth/chris.json" });

    test("can create and delete a task", async ({ tasksApi }) => {
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

    test("cannot create a task", async ({ tasksApi }) => {
      const taskPayload = buildTask({
        projectId: SEED_PROJECT_ID,
        assignee: "Alex",
      });

      const createResponse = await tasksApi.createTask(taskPayload);
      expect(createResponse.status()).toBe(403);

      const error = await readApiError(createResponse);
      expect(error.code).toBe("FORBIDDEN");
    });
  });

  test.describe("Anonymous", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("cannot create a task", async ({ tasksApi }) => {
      const taskPayload = buildTask({
        projectId: SEED_PROJECT_ID,
      });

      const createResponse = await tasksApi.createTask(taskPayload);
      expect(createResponse.status()).toBe(401);

      const error = await readApiError(createResponse);
      expect(error.code).toBe("UNAUTHORIZED");
    });
  });
});
