import type { Locator, Page } from "@playwright/test";

import type {
  TaskAssignee,
  TaskPriority,
  TaskStatus,
} from "../data/task.factory.js";

export type CreateTaskFormInput = {
  title: string;
  clientName: string;
  projectName: string;
  assignee: TaskAssignee;
  dueDate: string;
  priority?: TaskPriority;
  status?: TaskStatus;
};

export class TasksPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole("heading", { name: "Tasks", exact: true });
  }

  get addTaskButton(): Locator {
    return this.page.getByRole("button", { name: "Add Task" });
  }

  get deletedSuccessBanner(): Locator {
    return this.page.getByRole("status").filter({ hasText: "Task deleted successfully" });
  }

  private get addDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Add Task" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/tasks");
  }

  async openAddTask(): Promise<void> {
    await this.addTaskButton.click();
  }

  async fillNewTask(input: CreateTaskFormInput): Promise<void> {
    const dialog = this.addDialog;

    await dialog.getByLabel("Task Name").fill(input.title);
    await dialog.getByLabel("Client").selectOption({ label: input.clientName });
    await dialog.getByLabel("Project").selectOption({ label: input.projectName });
    await dialog.getByLabel("Assignee").selectOption({ label: input.assignee });
    await dialog.getByLabel("Due Date").fill(input.dueDate);

    if (input.priority) {
      await dialog.getByLabel("Priority").selectOption({ label: input.priority });
    }

    if (input.status) {
      await dialog.getByLabel("Status").selectOption({ label: input.status });
    }
  }

  async submitAddTask(): Promise<void> {
    await this.addDialog.getByRole("button", { name: "Add Task" }).click();
  }

  async createTask(input: CreateTaskFormInput): Promise<void> {
    await this.openAddTask();
    await this.fillNewTask(input);
    await this.submitAddTask();
  }

  taskRow(title: string): Locator {
    return this.page.getByRole("row").filter({ hasText: title });
  }

  taskViewLink(title: string): Locator {
    return this.taskRow(title).getByRole("link", { name: `View ${title}` });
  }
}
