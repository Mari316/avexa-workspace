import type { Locator, Page } from "@playwright/test";

import type {
  TaskAssignee,
  TaskPriority,
  TaskStatus,
} from "../data/task.factory.js";

export type EditTaskFormInput = {
  title?: string;
  projectName?: string;
  assignee?: TaskAssignee;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
};

export class TaskDetailsPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get editTaskButton(): Locator {
    return this.page.getByRole("button", { name: "Edit Task" });
  }

  get deleteTaskButton(): Locator {
    return this.page.getByRole("button", { name: "Delete Task" });
  }

  private get editDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Edit Task" });
  }

  private get deleteDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Delete Task" });
  }

  async openEdit(): Promise<void> {
    await this.editTaskButton.click();
  }

  async fillEditTask(input: EditTaskFormInput): Promise<void> {
    const dialog = this.editDialog;

    if (input.title !== undefined) {
      await dialog.getByLabel("Task Name").fill(input.title);
    }

    if (input.projectName !== undefined) {
      await dialog.getByLabel("Project").selectOption({ label: input.projectName });
    }

    if (input.assignee !== undefined) {
      await dialog.getByLabel("Assignee").selectOption({ label: input.assignee });
    }

    if (input.dueDate !== undefined) {
      await dialog.getByLabel("Due Date").fill(input.dueDate);
    }

    if (input.priority !== undefined) {
      await dialog.getByLabel("Priority").selectOption({ label: input.priority });
    }

    if (input.status !== undefined) {
      await dialog.getByLabel("Status").selectOption({ label: input.status });
    }
  }

  async submitEdit(): Promise<void> {
    await this.editDialog.getByRole("button", { name: "Save Changes" }).click();
  }

  async editTask(input: EditTaskFormInput): Promise<void> {
    await this.openEdit();
    await this.fillEditTask(input);
    await this.submitEdit();
  }

  async openDelete(): Promise<void> {
    await this.deleteTaskButton.click();
  }

  async confirmDelete(): Promise<void> {
    await this.deleteDialog.getByRole("button", { name: "Delete Task" }).click();
  }

  async deleteTask(): Promise<void> {
    await this.openDelete();
    await this.confirmDelete();
  }
}
