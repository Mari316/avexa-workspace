import { readCreatedClient } from "../../api/clients.api.js";
import { readCreatedProject } from "../../api/projects.api.js";
import { readApiError } from "../../api/tasks.api.js";
import { buildClient } from "../../data/client.factory.js";
import { buildProject } from "../../data/project.factory.js";
import { expect, test } from "../../fixtures/test.js";
import { cleanupTestData } from "../../support/db/cleanup.js";

const SEED_CLIENT_ID = "11111111-1111-4111-8111-111111111111";

test.describe("Projects API", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("can create and update a project", async ({
      clientsApi,
      projectsApi,
    }) => {
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

    test("rejects a project with an empty name", async ({ projectsApi }) => {
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
  });

  test.describe("QA Engineer (Chris)", () => {
    test.use({ storageState: "./.auth/chris.json" });

    test("can create and update a project", async ({ projectsApi }) => {
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

    test("cannot create a project", async ({ projectsApi }) => {
      const createResponse = await projectsApi.createProject(
        buildProject({ clientId: SEED_CLIENT_ID }),
      );
      expect(createResponse.status()).toBe(403);

      const error = await readApiError(createResponse);
      expect(error.code).toBe("FORBIDDEN");
    });

    test("cannot update a project", async ({ projectsApi }) => {
      const updateResponse = await projectsApi.updateProject("account-management", {
        status: "On Hold",
      });
      expect(updateResponse.status()).toBe(403);

      const error = await readApiError(updateResponse);
      expect(error.code).toBe("FORBIDDEN");
    });
  });

  test.describe("Anonymous", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("cannot create a project", async ({ projectsApi }) => {
      const createResponse = await projectsApi.createProject(
        buildProject({ clientId: SEED_CLIENT_ID }),
      );
      expect(createResponse.status()).toBe(401);

      const error = await readApiError(createResponse);
      expect(error.code).toBe("UNAUTHORIZED");
    });
  });
});
