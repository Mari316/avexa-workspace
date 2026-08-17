import type { TaskDTO } from "../../server/tasks/task.dto";
import { request } from "./request";

export type { TaskDTO };

export type CreateTaskBody = {
  title: string;
  projectId: string;
  assignee: string;
  dueDate: string;
  priority?: TaskDTO["priority"];
  status?: TaskDTO["status"];
};

export type UpdateTaskBody = {
  title?: string;
  projectId?: string;
  assignee?: string;
  dueDate?: string;
  priority?: TaskDTO["priority"];
  status?: TaskDTO["status"];
};

const TASKS_URL = "/api/v1/tasks";

export function listTasks(): Promise<TaskDTO[]> {
  return request<TaskDTO[]>(TASKS_URL);
}

export function createTask(body: CreateTaskBody): Promise<TaskDTO> {
  return request<TaskDTO>(TASKS_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateTask(slug: string, body: UpdateTaskBody): Promise<TaskDTO> {
  return request<TaskDTO>(`${TASKS_URL}/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteTask(slug: string): Promise<void> {
  return request<void>(`${TASKS_URL}/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}
