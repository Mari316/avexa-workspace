import type { Locator, Page } from "@playwright/test";

import type { NoteCategory } from "../data/note.factory.js";

export type CreateNoteFormInput = {
  title: string;
  clientName: string;
  projectName: string;
  category: NoteCategory;
  content: string;
  pinned?: boolean;
};

export type EditNoteFormInput = {
  title?: string;
  clientName?: string;
  projectName?: string;
  category?: NoteCategory;
  content?: string;
  pinned?: boolean;
};

export class NotesPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole("heading", { name: "Notes", exact: true });
  }

  get addNoteButton(): Locator {
    return this.page.getByRole("button", { name: "Add Note" });
  }

  get deletedSuccessBanner(): Locator {
    return this.page
      .getByRole("status")
      .filter({ hasText: "Note deleted successfully" });
  }

  get addDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Add Note" });
  }

  get editDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Edit Note" });
  }

  get deleteDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Delete Note" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/notes");
  }

  async openAddNote(): Promise<void> {
    await this.addNoteButton.click();
  }

  async fillNewNote(input: CreateNoteFormInput): Promise<void> {
    const dialog = this.addDialog;

    await dialog.getByLabel("Title").fill(input.title);
    await dialog.getByLabel("Client").selectOption({ label: input.clientName });
    await dialog.getByLabel("Project").selectOption({ label: input.projectName });
    await dialog.getByLabel("Category").selectOption({ label: input.category });
    await dialog.getByLabel("Note").fill(input.content);

    if (input.pinned !== undefined) {
      await dialog.getByLabel("Pinned").setChecked(input.pinned);
    }
  }

  async submitAddNote(): Promise<void> {
    await this.addDialog.getByRole("button", { name: "Add Note" }).click();
  }

  async createNote(input: CreateNoteFormInput): Promise<void> {
    await this.openAddNote();
    await this.fillNewNote(input);
    await this.submitAddNote();
  }

  async openEdit(title: string): Promise<void> {
    await this.noteCard(title).getByRole("button", { name: "Edit" }).click();
  }

  async fillEditNote(input: EditNoteFormInput): Promise<void> {
    const dialog = this.editDialog;

    if (input.title !== undefined) {
      await dialog.getByLabel("Title").fill(input.title);
    }

    if (input.clientName !== undefined) {
      await dialog.getByLabel("Client").selectOption({ label: input.clientName });
    }

    if (input.projectName !== undefined) {
      await dialog
        .getByLabel("Project")
        .selectOption({ label: input.projectName });
    }

    if (input.category !== undefined) {
      await dialog.getByLabel("Category").selectOption({ label: input.category });
    }

    if (input.content !== undefined) {
      await dialog.getByLabel("Note").fill(input.content);
    }

    if (input.pinned !== undefined) {
      await dialog.getByLabel("Pinned").setChecked(input.pinned);
    }
  }

  async submitEditNote(): Promise<void> {
    await this.editDialog.getByRole("button", { name: "Save Changes" }).click();
  }

  async editNote(title: string, input: EditNoteFormInput): Promise<void> {
    await this.openEdit(title);
    await this.fillEditNote(input);
    await this.submitEditNote();
  }

  async openDelete(title: string): Promise<void> {
    await this.noteCard(title).getByRole("button", { name: "Delete" }).click();
  }

  async confirmDelete(): Promise<void> {
    await this.deleteDialog.getByRole("button", { name: "Delete Note" }).click();
  }

  async deleteNote(title: string): Promise<void> {
    await this.openDelete(title);
    await this.confirmDelete();
  }

  noteCard(title: string): Locator {
    return this.page.getByRole("article").filter({
      has: this.page.getByRole("heading", { name: title, exact: true }),
    });
  }

  pinnedIndicator(title: string): Locator {
    return this.noteCard(title).getByText("Pinned", { exact: true });
  }
}
