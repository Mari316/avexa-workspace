import { readCreatedNote } from "../../api/notes.api.js";
import { readCreatedProject } from "../../api/projects.api.js";
import { readApiError } from "../../api/errors.js";
import { buildNote } from "../../data/note.factory.js";
import { buildProject } from "../../data/project.factory.js";
import { expect, test } from "../../fixtures/test.js";

const SEED_PROJECT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

test.describe("Notes API", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("can create, update, and delete a note", async ({
      client,
      notesApi,
      projectsApi,
    }) => {
      const projectPayload = buildProject({ clientId: client.id });
      const createProjectResponse = await projectsApi.createProject(projectPayload);
      expect(createProjectResponse.status()).toBe(201);
      const project = await readCreatedProject(createProjectResponse);

      const notePayload = buildNote({ projectId: project.id });
      let createdSlug: string | undefined;

      try {
        const createResponse = await notesApi.createNote(notePayload);
        expect(createResponse.status()).toBe(201);

        const created = await readCreatedNote(createResponse);
        expect(created.title).toBe(notePayload.title);
        expect(created.content).toBe(notePayload.content);
        expect(created.projectId).toBe(project.id);
        expect(created.clientId).toBe(client.id);
        expect(created.category).toBe(notePayload.category);
        expect(created.pinned).toBe(false);
        expect(created.author.length).toBeGreaterThan(0);
        expect(created.slug.length).toBeGreaterThan(0);
        createdSlug = created.slug;

        const getResponse = await notesApi.getNote(created.slug);
        expect(getResponse.status()).toBe(200);
        const fetched = await readCreatedNote(getResponse);
        expect(fetched.slug).toBe(created.slug);
        expect(fetched.title).toBe(created.title);
        expect(fetched.content).toBe(created.content);
        expect(fetched.projectId).toBe(created.projectId);
        expect(fetched.clientId).toBe(created.clientId);
        expect(fetched.category).toBe(created.category);
        expect(fetched.pinned).toBe(false);
        expect(fetched.author).toBe(created.author);

        const updatedTitle = `${notePayload.title} edited`;
        const patchResponse = await notesApi.updateNote(created.slug, {
          title: updatedTitle,
          pinned: true,
        });
        expect(patchResponse.status()).toBe(200);

        const getUpdatedResponse = await notesApi.getNote(created.slug);
        expect(getUpdatedResponse.status()).toBe(200);
        const updated = await readCreatedNote(getUpdatedResponse);
        expect(updated.title).toBe(updatedTitle);
        expect(updated.pinned).toBe(true);
        expect(updated.slug).toBe(created.slug);
        expect(updated.author).toBe(created.author);

        const deleteResponse = await notesApi.deleteNote(created.slug);
        expect(deleteResponse.status()).toBe(204);
        createdSlug = undefined;

        const getDeletedResponse = await notesApi.getNote(created.slug);
        expect(getDeletedResponse.status()).toBe(404);
        const error = await readApiError(getDeletedResponse);
        expect(error.code).toBe("NOTE_NOT_FOUND");
      } finally {
        if (createdSlug) {
          await notesApi.deleteNote(createdSlug);
        }
      }
    });

    test("rejects a note with an empty title", async ({ notesApi }) => {
      const notePayload = buildNote({
        projectId: SEED_PROJECT_ID,
        title: "",
      });

      const createResponse = await notesApi.createNote(notePayload);
      expect(createResponse.status()).toBe(400);

      const error = await readApiError(createResponse);
      expect(error.code).toBe("VALIDATION_ERROR");
    });
  });

  test.describe("QA Engineer (Chris)", () => {
    test.use({ storageState: "./.auth/chris.json" });

    test("can create, update, and delete a note", async ({ notesApi }) => {
      const notePayload = buildNote({
        projectId: SEED_PROJECT_ID,
        category: "Investigation",
      });

      let createdSlug: string | undefined;

      try {
        const createResponse = await notesApi.createNote(notePayload);
        expect(createResponse.status()).toBe(201);

        const created = await readCreatedNote(createResponse);
        expect(created.title).toBe(notePayload.title);
        createdSlug = created.slug;

        const patchResponse = await notesApi.updateNote(created.slug, {
          title: `${notePayload.title} edited`,
          pinned: true,
        });
        expect(patchResponse.status()).toBe(200);

        const deleteResponse = await notesApi.deleteNote(created.slug);
        expect(deleteResponse.status()).toBe(204);
        createdSlug = undefined;
      } finally {
        if (createdSlug) {
          await notesApi.deleteNote(createdSlug);
        }
      }
    });
  });

  test.describe("Viewer (Alex)", () => {
    test.use({ storageState: "./.auth/alex.json" });

    test("can list notes but cannot create one", async ({ notesApi }) => {
      const listResponse = await notesApi.listNotes();
      expect(listResponse.status()).toBe(200);

      const createResponse = await notesApi.createNote(
        buildNote({ projectId: SEED_PROJECT_ID }),
      );
      expect(createResponse.status()).toBe(403);

      const error = await readApiError(createResponse);
      expect(error.code).toBe("FORBIDDEN");
    });
  });

  test.describe("Anonymous", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("cannot create a note", async ({ notesApi }) => {
      const createResponse = await notesApi.createNote(
        buildNote({ projectId: SEED_PROJECT_ID }),
      );
      expect(createResponse.status()).toBe(401);

      const error = await readApiError(createResponse);
      expect(error.code).toBe("UNAUTHORIZED");
    });
  });
});
