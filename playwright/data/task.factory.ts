export type TaskAssignee = "Mari" | "Chris" | "Alex";
export type TaskPriority = "High" | "Medium" | "Low";
export type TaskStatus =
  | "To Do"
  | "In Progress"
  | "Review"
  | "Blocked"
  | "Done";

export type CreateTaskRequest = {
  title: string;
  projectId: string;
  assignee: TaskAssignee;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
};

export type BuildTaskInput = {
  projectId: string;
} & Partial<Omit<CreateTaskRequest, "projectId">>;

export function buildTask(input: BuildTaskInput): CreateTaskRequest {
  return {
    projectId: input.projectId,
    title: input.title ?? `PW task ${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    assignee: input.assignee ?? "Mari",
    dueDate: input.dueDate ?? "2026-12-31",
    priority: input.priority ?? "Low",
    status: input.status ?? "To Do",
  };
}
