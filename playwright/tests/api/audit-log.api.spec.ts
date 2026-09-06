import { readAuditLog } from "../../api/audit-log.api.js";
import { readApiError } from "../../api/errors.js";
import { readCreatedProject } from "../../api/projects.api.js";
import { readCreatedTask } from "../../api/tasks.api.js";
import { buildProject } from "../../data/project.factory.js";
import { buildTask } from "../../data/task.factory.js";
import { expect, test } from "../../fixtures/test.js";
import { cleanupTestData } from "../../support/db/cleanup.js";

test.describe("Audit Log API", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("returns audit events as an array", async ({ auditLogApi }) => {
      const response = await auditLogApi.getAuditLog();
      expect(response.status()).toBe(200);

      const events = await readAuditLog(response);
      expect(Array.isArray(events)).toBe(true);

      for (const event of events) {
        expect(typeof event.id).toBe("string");
        expect(typeof event.createdAt).toBe("string");
        expect(typeof event.actorName).toBe("string");
        expect(["Created", "Updated", "Deleted"]).toContain(event.action);
        expect(["Client", "Contact", "Project", "Task", "Note"]).toContain(
          event.entityType,
        );
        expect(typeof event.entitySlug).toBe("string");
        expect(typeof event.entityLabel).toBe("string");
        expect(typeof event.details).toBe("string");
      }
    });

    test("records TASK_CREATED for an owned unique Task", async ({
      auditLogApi,
      client,
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
        const auditResponse = await auditLogApi.getAuditLog({
          q: created.title,
          entityType: "task",
          action: "created",
        });
        expect(auditResponse.status()).toBe(200);

        const events = await readAuditLog(auditResponse);
        const matches = events.filter(
          (event) =>
            event.action === "Created" &&
            event.entityType === "Task" &&
            event.entityLabel === created.title &&
            event.entitySlug === created.slug,
        );

        expect(matches).toHaveLength(1);
        expect(matches[0]?.actorName).toBe("Mari Astapova");
        expect(matches[0]?.details).toContain(created.title);
      } finally {
        await cleanupTestData({
          auditEntities: [{ entityType: "task", entitySlug: created.slug }],
        });
      }
    });

    test("keeps a TASK_DELETED snapshot after the Task is gone", async ({
      auditLogApi,
      client,
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

      try {
        const deleteResponse = await tasksApi.deleteTask(created.slug);
        expect(deleteResponse.status()).toBe(204);

        const getDeleted = await tasksApi.getTask(created.slug);
        expect(getDeleted.status()).toBe(404);

        const auditResponse = await auditLogApi.getAuditLog({
          q: created.title,
          entityType: "task",
          action: "deleted",
        });
        expect(auditResponse.status()).toBe(200);

        const events = await readAuditLog(auditResponse);
        const matches = events.filter(
          (event) =>
            event.action === "Deleted" &&
            event.entityType === "Task" &&
            event.entityLabel === created.title &&
            event.entitySlug === created.slug,
        );

        expect(matches).toHaveLength(1);
        expect(matches[0]?.actorName).toBe("Mari Astapova");
        expect(matches[0]?.details).toContain(created.title);
      } finally {
        await cleanupTestData({
          auditEntities: [{ entityType: "task", entitySlug: created.slug }],
        });
      }
    });
  });

  test.describe("Viewer (Alex)", () => {
    test.use({ storageState: "./.auth/alex.json" });

    test("can read the audit log", async ({ auditLogApi }) => {
      const response = await auditLogApi.getAuditLog();
      expect(response.status()).toBe(200);

      const events = await readAuditLog(response);
      expect(Array.isArray(events)).toBe(true);
    });
  });

  test.describe("Anonymous", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("cannot read the audit log", async ({ auditLogApi }) => {
      const response = await auditLogApi.getAuditLog();
      expect(response.status()).toBe(401);

      const error = await readApiError(response);
      expect(error.code).toBe("UNAUTHORIZED");
    });
  });
});
