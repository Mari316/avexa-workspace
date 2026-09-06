import type { Locator, Page } from "@playwright/test";

import type {
  ProjectEnvironment,
  ProjectStatus,
} from "../data/project.factory.js";

export type CreateProjectFormInput = {
  name: string;
  clientName: string;
  environment: ProjectEnvironment;
  status?: ProjectStatus;
};

export class ProjectsPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole("heading", { name: "Projects", exact: true });
  }

  get addProjectButton(): Locator {
    return this.page.getByRole("button", { name: "Add Project" });
  }

  private get addDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Add Project" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/projects");
  }

  async openAddProject(): Promise<void> {
    await this.addProjectButton.click();
  }

  async fillNewProject(input: CreateProjectFormInput): Promise<void> {
    const dialog = this.addDialog;

    await dialog.getByLabel("Project Name").fill(input.name);
    await dialog.getByLabel("Client").selectOption({ label: input.clientName });
    await dialog
      .getByLabel("Environment")
      .selectOption({ label: input.environment });

    if (input.status) {
      await dialog.getByLabel("Status").selectOption({ label: input.status });
    }
  }

  async submitAddProject(): Promise<void> {
    await this.addDialog.getByRole("button", { name: "Add Project" }).click();
  }

  async createProject(input: CreateProjectFormInput): Promise<void> {
    await this.openAddProject();
    await this.fillNewProject(input);
    await this.submitAddProject();
  }

  projectRow(name: string): Locator {
    return this.page.getByRole("row").filter({ hasText: name });
  }

  projectViewLink(name: string): Locator {
    return this.projectRow(name).getByRole("link", { name: `View ${name}` });
  }
}
