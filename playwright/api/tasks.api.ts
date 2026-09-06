import type { APIRequestContext, APIResponse } from "@playwright/test";

import type {
  CreateTaskRequest,
  TaskStatus,
} from "../data/task.factory.js";
import { isRecord } from "./errors.js";

export type CreatedTask = {
  slug: string;
  title: string;
};

export type UpdateTaskRequest = {
  status: TaskStatus;
};

export class TasksApi {
  constructor(private readonly request: APIRequestContext) {}

  createTask(payload: CreateTaskRequest): Promise<APIResponse> {
    return this.request.post("/api/v1/tasks", { data: payload });
  }

  updateTask(slug: string, payload: UpdateTaskRequest): Promise<APIResponse> {
    return this.request.patch(`/api/v1/tasks/${encodeURIComponent(slug)}`, {
      data: payload,
    });
  }

  deleteTask(slug: string): Promise<APIResponse> {
    return this.request.delete(`/api/v1/tasks/${encodeURIComponent(slug)}`);
  }
}

export async function readCreatedTask(
  response: APIResponse,
): Promise<CreatedTask> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Task create response is missing data");
  }

  const slug = body.data.slug;
  const title = body.data.title;

  if (typeof slug !== "string" || slug.length === 0) {
    throw new Error("Task create response is missing data.slug");
  }

  if (typeof title !== "string") {
    throw new Error("Task create response is missing data.title");
  }

  return { slug, title };
}
