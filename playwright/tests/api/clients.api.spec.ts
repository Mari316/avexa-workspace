import { expect, test } from "@playwright/test";

import {
  ClientsApi,
  readCreatedClient,
} from "../../api/clients.api.js";
import { readApiError } from "../../api/tasks.api.js";
import { buildClient } from "../../data/client.factory.js";
import { cleanupTestData } from "../../support/db/cleanup.js";

test.describe("Clients API", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

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
  });

  test.describe("Viewer (Alex)", () => {
    test.use({ storageState: "./.auth/alex.json" });

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
  });

  test.describe("Anonymous", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("API requests still return 401", async ({ request }) => {
      const res = await request.get("/api/v1/clients");
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    test("cannot create a client", async ({ request }) => {
      const clientsApi = new ClientsApi(request);
      const createResponse = await clientsApi.createClient(buildClient());
      expect(createResponse.status()).toBe(401);

      const error = await readApiError(createResponse);
      expect(error.code).toBe("UNAUTHORIZED");
    });
  });
});
