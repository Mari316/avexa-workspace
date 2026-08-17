import type { ProjectDTO } from "../../server/projects/project.dto";
import { request } from "./request";

export type { ProjectDTO };

export type CreateProjectBody = {
  name: string;
  clientId: string;
  environment: ProjectDTO["environment"];
  status?: ProjectDTO["status"];
};

export type UpdateProjectBody = {
  name?: string;
  clientId?: string;
  environment?: ProjectDTO["environment"];
  status?: ProjectDTO["status"];
};

const PROJECTS_URL = "/api/v1/projects";

export function listProjects(): Promise<ProjectDTO[]> {
  return request<ProjectDTO[]>(PROJECTS_URL);
}

export function createProject(body: CreateProjectBody): Promise<ProjectDTO> {
  return request<ProjectDTO>(PROJECTS_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateProject(
  slug: string,
  body: UpdateProjectBody,
): Promise<ProjectDTO> {
  return request<ProjectDTO>(`${PROJECTS_URL}/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
