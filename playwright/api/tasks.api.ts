import type { APIRequestContext, APIResponse } from "@playwright/test";

import type {
  CreateTaskRequest,
  TaskStatus,
} from "../data/task.factory.js";

export type CreatedTask = {
  slug: string;
  title: string;
};

export type UpdateTaskRequest = {
  status: TaskStatus;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: { path: string; message: string }[];
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

export async function readApiError(
  response: APIResponse,
): Promise<ApiErrorBody> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !isRecord(body.error)) {
    throw new Error("API error response is missing error");
  }

  const code = body.error.code;
  const message = body.error.message;

  if (typeof code !== "string" || typeof message !== "string") {
    throw new Error("API error response is missing error.code or error.message");
  }

  const details = parseErrorDetails(body.error.details);

  return details ? { code, message, details } : { code, message };
}

function parseErrorDetails(
  value: unknown,
): { path: string; message: string }[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const details: { path: string; message: string }[] = [];

  for (const item of value) {
    if (!isRecord(item) || typeof item.path !== "string" || typeof item.message !== "string") {
      throw new Error("API error response has an invalid details entry");
    }

    details.push({ path: item.path, message: item.message });
  }

  return details;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
