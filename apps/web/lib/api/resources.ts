import type { ResourceDTO } from "../../server/resources/resource.dto";
import { request } from "./request";

export type { ResourceDTO };

export type CreateResourceBody = {
  name: string;
  url: string;
  type: ResourceDTO["type"];
  status?: ResourceDTO["status"];
  projectId: string;
};

export type UpdateResourceBody = {
  name?: string;
  url?: string;
  type?: ResourceDTO["type"];
  status?: ResourceDTO["status"];
  projectId?: string;
};

const RESOURCES_URL = "/api/v1/resources";

export function listResources(): Promise<ResourceDTO[]> {
  return request<ResourceDTO[]>(RESOURCES_URL);
}

export function createResource(body: CreateResourceBody): Promise<ResourceDTO> {
  return request<ResourceDTO>(RESOURCES_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateResource(
  id: string,
  body: UpdateResourceBody,
): Promise<ResourceDTO> {
  return request<ResourceDTO>(`${RESOURCES_URL}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteResource(id: string): Promise<void> {
  return request<void>(`${RESOURCES_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
