import { expect, test } from "@playwright/test";

import {
  ClientsApi,
  readCreatedClient,
} from "../../api/clients.api.js";
import {
  ContactsApi,
  readCreatedContact,
} from "../../api/contacts.api.js";
import { readApiError } from "../../api/tasks.api.js";
import { buildClient } from "../../data/client.factory.js";
import { buildContact } from "../../data/contact.factory.js";
import { cleanupTestData } from "../../support/db/cleanup.js";

const SEED_CLIENT_ID = "11111111-1111-4111-8111-111111111111";

test.describe("Contacts API", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("can create and update a contact", async ({ request }) => {
      const clientsApi = new ClientsApi(request);
      const contactsApi = new ContactsApi(request);
      let clientSlug: string | undefined;

      try {
        const createClientResponse = await clientsApi.createClient(buildClient());
        expect(createClientResponse.status()).toBe(201);
        const client = await readCreatedClient(createClientResponse);
        clientSlug = client.slug;

        const contactPayload = buildContact({ clientId: client.id });
        const createContactResponse = await contactsApi.createContact(contactPayload);
        expect(createContactResponse.status()).toBe(201);

        const created = await readCreatedContact(createContactResponse);
        expect(created.email).toBe(contactPayload.email);
        expect(created.clientId).toBe(client.id);

        const updateResponse = await contactsApi.updateContact(created.slug, {
          role: "Lead Tester",
        });
        expect(updateResponse.status()).toBe(200);

        const getResponse = await contactsApi.getContact(created.slug);
        expect(getResponse.status()).toBe(200);
        const fetched = await readCreatedContact(getResponse);
        expect(fetched.role).toBe("Lead Tester");
      } finally {
        if (clientSlug) {
          await cleanupTestData({ clientSlugs: [clientSlug] });
        }
      }
    });

    test("rejects a contact with an invalid email", async ({ request }) => {
      const contactsApi = new ContactsApi(request);
      const contactPayload = buildContact({
        clientId: SEED_CLIENT_ID,
        email: "not-an-email",
      });

      const createResponse = await contactsApi.createContact(contactPayload);
      expect(createResponse.status()).toBe(400);

      const error = await readApiError(createResponse);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.details?.some((detail) => detail.path === "email")).toBe(true);
    });
  });

  test.describe("QA Engineer (Chris)", () => {
    test.use({ storageState: "./.auth/chris.json" });

    test("can read contacts but cannot create or update them", async ({
      request,
    }) => {
      const list = await request.get("/api/v1/contacts");
      expect(list.status()).toBe(200);

      const contactsApi = new ContactsApi(request);
      const createResponse = await contactsApi.createContact(
        buildContact({ clientId: SEED_CLIENT_ID }),
      );
      expect(createResponse.status()).toBe(403);
      const createError = await readApiError(createResponse);
      expect(createError.code).toBe("FORBIDDEN");

      const patchResponse = await contactsApi.updateContact("mitchell-lubbers", {
        role: "Should Not Update",
      });
      expect(patchResponse.status()).toBe(403);
    });
  });

  test.describe("Viewer (Alex)", () => {
    test.use({ storageState: "./.auth/alex.json" });

    test("cannot create a contact", async ({ request }) => {
      const contactsApi = new ContactsApi(request);
      const createResponse = await contactsApi.createContact(
        buildContact({ clientId: SEED_CLIENT_ID }),
      );
      expect(createResponse.status()).toBe(403);

      const error = await readApiError(createResponse);
      expect(error.code).toBe("FORBIDDEN");
    });

    test("cannot update a contact", async ({ request }) => {
      const contactsApi = new ContactsApi(request);
      const updateResponse = await contactsApi.updateContact("mitchell-lubbers", {
        role: "Should Not Update",
      });
      expect(updateResponse.status()).toBe(403);

      const error = await readApiError(updateResponse);
      expect(error.code).toBe("FORBIDDEN");
    });
  });

  test.describe("Anonymous", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("cannot create a contact", async ({ request }) => {
      const contactsApi = new ContactsApi(request);
      const createResponse = await contactsApi.createContact(
        buildContact({ clientId: SEED_CLIENT_ID }),
      );
      expect(createResponse.status()).toBe(401);

      const error = await readApiError(createResponse);
      expect(error.code).toBe("UNAUTHORIZED");
    });
  });
});
