import { readCreatedProject } from "../../api/projects.api.js";
import {
  readCreatedResource,
  readResourceList,
} from "../../api/resources.api.js";
import { readApiError } from "../../api/errors.js";
import { buildProject } from "../../data/project.factory.js";
import { buildResource } from "../../data/resource.factory.js";
import { expect, test } from "../../fixtures/test.js";

const SEED_PROJECT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

test.describe("Resources API", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("can create, update, and delete a resource", async ({
      client,
      projectsApi,
      resourcesApi,
    }) => {
      const projectPayload = buildProject({ clientId: client.id });
      const createProjectResponse = await projectsApi.createProject(projectPayload);
      expect(createProjectResponse.status()).toBe(201);
      const project = await readCreatedProject(createProjectResponse);

      const resourcePayload = buildResource({ projectId: project.id });
      let createdId: string | undefined;

      try {
        const createResponse = await resourcesApi.createResource(resourcePayload);
        expect(createResponse.status()).toBe(201);

        const created = await readCreatedResource(createResponse);
        expect(created.id.length).toBeGreaterThan(0);
        expect(created.name).toBe(resourcePayload.name);
        expect(created.url).toBe(resourcePayload.url);
        expect(created.type).toBe(resourcePayload.type);
        expect(created.status).toBe("Active");
        expect(created.projectId).toBe(project.id);
        expect(created.projectName).toBe(project.name);
        expect(created.clientId).toBe(client.id);
        expect(created.clientName).toBe(client.name);
        createdId = created.id;

        const listAfterCreate = await resourcesApi.listResources();
        expect(listAfterCreate.status()).toBe(200);
        const listedAfterCreate = await readResourceList(listAfterCreate);
        expect(
          listedAfterCreate.some((resource) => resource.id === created.id),
        ).toBe(true);

        const updatedName = `${resourcePayload.name} edited`;
        const updatedUrl = `${resourcePayload.url}/edited`;
        const patchResponse = await resourcesApi.updateResource(created.id, {
          name: updatedName,
          url: updatedUrl,
          status: "Inactive",
        });
        expect(patchResponse.status()).toBe(200);
        const patched = await readCreatedResource(patchResponse);
        expect(patched.name).toBe(updatedName);
        expect(patched.url).toBe(updatedUrl);
        expect(patched.status).toBe("Inactive");

        const listAfterPatch = await resourcesApi.listResources();
        expect(listAfterPatch.status()).toBe(200);
        const listedAfterPatch = (await readResourceList(listAfterPatch)).find(
          (resource) => resource.id === created.id,
        );
        expect(listedAfterPatch?.name).toBe(updatedName);
        expect(listedAfterPatch?.url).toBe(updatedUrl);
        expect(listedAfterPatch?.status).toBe("Inactive");

        const deleteResponse = await resourcesApi.deleteResource(created.id);
        expect(deleteResponse.status()).toBe(204);
        createdId = undefined;

        const listAfterDelete = await resourcesApi.listResources();
        expect(listAfterDelete.status()).toBe(200);
        const listedAfterDelete = await readResourceList(listAfterDelete);
        expect(
          listedAfterDelete.some((resource) => resource.id === created.id),
        ).toBe(false);
      } finally {
        if (createdId) {
          await resourcesApi.deleteResource(createdId);
        }
      }
    });

    test("rejects javascript and malformed URLs", async ({ resourcesApi }) => {
      const javascriptResponse = await resourcesApi.createResource(
        buildResource({
          projectId: SEED_PROJECT_ID,
          url: "javascript:alert(1)",
        }),
      );
      expect(javascriptResponse.status()).toBe(400);
      expect((await readApiError(javascriptResponse)).code).toBe(
        "VALIDATION_ERROR",
      );

      const malformedResponse = await resourcesApi.createResource(
        buildResource({
          projectId: SEED_PROJECT_ID,
          url: "not-a-url",
        }),
      );
      expect(malformedResponse.status()).toBe(400);
      expect((await readApiError(malformedResponse)).code).toBe(
        "VALIDATION_ERROR",
      );
    });
  });

  test.describe("QA Engineer (Chris)", () => {
    test.use({ storageState: "./.auth/chris.json" });

    test("can create, update, and delete a resource", async ({
      resourcesApi,
    }) => {
      const resourcePayload = buildResource({
        projectId: SEED_PROJECT_ID,
        type: "Environment",
      });
      let createdId: string | undefined;

      try {
        const createResponse = await resourcesApi.createResource(resourcePayload);
        expect(createResponse.status()).toBe(201);
        const created = await readCreatedResource(createResponse);
        expect(created.name).toBe(resourcePayload.name);
        createdId = created.id;

        const patchResponse = await resourcesApi.updateResource(created.id, {
          status: "Inactive",
        });
        expect(patchResponse.status()).toBe(200);

        const deleteResponse = await resourcesApi.deleteResource(created.id);
        expect(deleteResponse.status()).toBe(204);
        createdId = undefined;
      } finally {
        if (createdId) {
          await resourcesApi.deleteResource(createdId);
        }
      }
    });
  });

  test.describe("Viewer (Alex)", () => {
    test.use({ storageState: "./.auth/alex.json" });

    test("can list resources but cannot create one", async ({
      resourcesApi,
    }) => {
      const listResponse = await resourcesApi.listResources();
      expect(listResponse.status()).toBe(200);

      const createResponse = await resourcesApi.createResource(
        buildResource({ projectId: SEED_PROJECT_ID }),
      );
      expect(createResponse.status()).toBe(403);
      expect((await readApiError(createResponse)).code).toBe("FORBIDDEN");
    });
  });

  test.describe("Anonymous", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("cannot read or create resources", async ({ resourcesApi }) => {
      const listResponse = await resourcesApi.listResources();
      expect(listResponse.status()).toBe(401);
      expect((await readApiError(listResponse)).code).toBe("UNAUTHORIZED");

      const createResponse = await resourcesApi.createResource(
        buildResource({ projectId: SEED_PROJECT_ID }),
      );
      expect(createResponse.status()).toBe(401);
      expect((await readApiError(createResponse)).code).toBe("UNAUTHORIZED");
    });
  });
});
