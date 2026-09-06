import type { APIRequestContext, APIResponse } from "@playwright/test";

import type {
  CreateProjectRequest,
  ProjectStatus,
  UpdateProjectRequest,
} from "../data/project.factory.js";

export type CreatedProject = {
  slug: string;
  name: string;
  clientId: string;
  status: ProjectStatus;
};

export class ProjectsApi {
  constructor(private readonly request: APIRequestContext) {}

  createProject(payload: CreateProjectRequest): Promise<APIResponse> {
    return this.request.post("/api/v1/projects", { data: payload });
  }

  getProject(slug: string): Promise<APIResponse> {
    return this.request.get(`/api/v1/projects/${encodeURIComponent(slug)}`);
  }

  updateProject(slug: string, payload: UpdateProjectRequest): Promise<APIResponse> {
    return this.request.patch(`/api/v1/projects/${encodeURIComponent(slug)}`, {
      data: payload,
    });
  }
}

export async function readCreatedProject(
  response: APIResponse,
): Promise<CreatedProject> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Project response is missing data");
  }

  const slug = body.data.slug;
  const name = body.data.name;
  const clientId = body.data.clientId;
  const status = body.data.status;

  if (typeof slug !== "string" || slug.length === 0) {
    throw new Error("Project response is missing data.slug");
  }

  if (typeof name !== "string") {
    throw new Error("Project response is missing data.name");
  }

  if (typeof clientId !== "string" || clientId.length === 0) {
    throw new Error("Project response is missing data.clientId");
  }

  if (!isProjectStatus(status)) {
    throw new Error("Project response has an invalid data.status");
  }

  return { slug, name, clientId, status };
}

function isProjectStatus(value: unknown): value is ProjectStatus {
  return value === "Active" || value === "On Hold";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
