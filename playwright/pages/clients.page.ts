import type { Locator, Page } from "@playwright/test";

export type ClientFormStatus = "Active" | "On Hold";

export class ClientsPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole("heading", { name: "Clients" });
  }

  get addClientButton(): Locator {
    return this.page.getByRole("button", { name: "Add Client" });
  }

  get clientsNavLink(): Locator {
    return this.page.getByRole("link", { name: "Clients" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/clients");
  }

  async openFromHome(): Promise<void> {
    await this.page.goto("/");
    await this.clientsNavLink.click();
  }

  async openAddClient(): Promise<void> {
    await this.addClientButton.click();
  }

  async fillNewClient(input: {
    name: string;
    status: ClientFormStatus;
  }): Promise<void> {
    await this.page.getByLabel("Client Name").fill(input.name);
    await this.page.getByLabel("Status").selectOption({ label: input.status });
  }

  async submitAddClient(): Promise<void> {
    await this.page
      .getByRole("dialog")
      .getByRole("button", { name: "Add Client" })
      .click();
  }

  async createClient(input: {
    name: string;
    status: ClientFormStatus;
  }): Promise<void> {
    await this.openAddClient();
    await this.fillNewClient(input);
    await this.submitAddClient();
  }

  clientRow(name: string): Locator {
    return this.page.getByRole("row").filter({ hasText: name });
  }

  clientViewLink(name: string): Locator {
    return this.clientRow(name).getByRole("link", { name: /View/ });
  }
}
