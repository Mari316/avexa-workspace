import type { Locator, Page } from "@playwright/test";

import type { ContactStatus } from "../data/contact.factory.js";

export type CreateContactFormInput = {
  firstName: string;
  lastName: string;
  clientName: string;
  email: string;
  role: string;
  status?: ContactStatus;
};

export type EditContactFormInput = {
  firstName?: string;
  lastName?: string;
  clientName?: string;
  email?: string;
  role?: string;
  status?: ContactStatus;
};

export class ContactsPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole("heading", { name: "Contacts", exact: true });
  }

  get addContactButton(): Locator {
    return this.page.getByRole("button", { name: "Add Contact" });
  }

  private get addDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Add Contact" });
  }

  private get editDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Edit Contact" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/contacts");
  }

  async openAddContact(): Promise<void> {
    await this.addContactButton.click();
  }

  async fillNewContact(input: CreateContactFormInput): Promise<void> {
    const dialog = this.addDialog;

    await dialog.getByLabel("First Name").fill(input.firstName);
    await dialog.getByLabel("Last Name").fill(input.lastName);
    await dialog.getByLabel("Client").selectOption({ label: input.clientName });
    await dialog.getByLabel("Email").fill(input.email);
    await dialog.getByLabel("Role").fill(input.role);

    if (input.status) {
      await dialog.getByLabel("Status").selectOption({ label: input.status });
    }
  }

  async submitAddContact(): Promise<void> {
    await this.addDialog.getByRole("button", { name: "Add Contact" }).click();
  }

  async createContact(input: CreateContactFormInput): Promise<void> {
    await this.openAddContact();
    await this.fillNewContact(input);
    await this.submitAddContact();
  }

  async openEdit(name: string): Promise<void> {
    await this.contactRow(name).getByRole("button", { name: "Edit" }).click();
  }

  async fillEditContact(input: EditContactFormInput): Promise<void> {
    const dialog = this.editDialog;

    if (input.firstName !== undefined) {
      await dialog.getByLabel("First Name").fill(input.firstName);
    }

    if (input.lastName !== undefined) {
      await dialog.getByLabel("Last Name").fill(input.lastName);
    }

    if (input.clientName !== undefined) {
      await dialog.getByLabel("Client").selectOption({ label: input.clientName });
    }

    if (input.email !== undefined) {
      await dialog.getByLabel("Email").fill(input.email);
    }

    if (input.role !== undefined) {
      await dialog.getByLabel("Role").fill(input.role);
    }

    if (input.status !== undefined) {
      await dialog.getByLabel("Status").selectOption({ label: input.status });
    }
  }

  async submitEditContact(): Promise<void> {
    await this.editDialog.getByRole("button", { name: "Save Changes" }).click();
  }

  async editContact(name: string, input: EditContactFormInput): Promise<void> {
    await this.openEdit(name);
    await this.fillEditContact(input);
    await this.submitEditContact();
  }

  contactRow(name: string): Locator {
    return this.page.getByRole("row").filter({ hasText: name });
  }

  contactViewLink(name: string): Locator {
    return this.contactRow(name).getByRole("link", { name: /View/ });
  }
}
