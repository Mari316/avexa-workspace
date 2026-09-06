import { readNoteList } from "../../api/notes.api.js";
import { readCreatedProject } from "../../api/projects.api.js";
import { buildNote } from "../../data/note.factory.js";
import { buildProject } from "../../data/project.factory.js";
import { expect, test } from "../../fixtures/test.js";

test.describe("Notes UI", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("can create, edit, pin, and delete a note that survives refresh", async ({
      client,
      notesApi,
      notesPage,
      page,
      projectsApi,
    }) => {
      const projectPayload = buildProject({ clientId: client.id });
      const createProjectResponse = await projectsApi.createProject(projectPayload);
      expect(createProjectResponse.status()).toBe(201);
      const project = await readCreatedProject(createProjectResponse);

      const notePayload = buildNote({
        projectId: project.id,
        category: "Testing",
      });
      const updatedTitle = `${notePayload.title} edited`;
      let createdSlug: string | undefined;

      try {
        await notesPage.goto();
        await expect(notesPage.heading).toBeVisible();

        await notesPage.createNote({
          title: notePayload.title,
          clientName: client.name,
          projectName: project.name,
          category: notePayload.category,
          content: notePayload.content,
        });

        await expect(notesPage.addDialog).toHaveCount(0);
        await expect(notesPage.noteCard(notePayload.title)).toBeVisible();

        const listAfterCreate = await notesApi.listNotes();
        expect(listAfterCreate.status()).toBe(200);
        const createdFromList = (await readNoteList(listAfterCreate)).find(
          (note) => note.title === notePayload.title,
        );
        expect(createdFromList).toBeDefined();
        createdSlug = createdFromList?.slug;

        await page.reload();
        await expect(notesPage.noteCard(notePayload.title)).toBeVisible();

        await notesPage.editNote(notePayload.title, {
          title: updatedTitle,
          category: "Investigation",
          pinned: true,
        });

        await expect(notesPage.editDialog).toHaveCount(0);
        await expect(notesPage.noteCard(updatedTitle)).toBeVisible();
        await expect(notesPage.pinnedIndicator(updatedTitle)).toBeVisible();

        await page.reload();
        await expect(notesPage.noteCard(updatedTitle)).toBeVisible();
        await expect(notesPage.pinnedIndicator(updatedTitle)).toBeVisible();

        await notesPage.deleteNote(updatedTitle);
        await expect(notesPage.deletedSuccessBanner).toBeVisible();
        await expect(notesPage.noteCard(updatedTitle)).toHaveCount(0);

        await page.reload();
        await expect(notesPage.noteCard(updatedTitle)).toHaveCount(0);
        await expect(notesPage.noteCard(notePayload.title)).toHaveCount(0);
      } finally {
        if (createdSlug) {
          await notesApi.deleteNote(createdSlug);
        }
      }
    });
  });
});
