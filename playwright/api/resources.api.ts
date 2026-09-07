import type { APIRequestContext, APIResponse } from "@playwright/test";

import type {
  CreateResourceRequest,
  ResourceStatus,
  ResourceType,
  UpdateResourceRequest,
} from "../data/resource.factory.js";
import { isRecord } from "./errors.js";

export type CreatedResource = {
  id: string;
  name: string;
  url: string;
  type: ResourceType;
  status: ResourceStatus;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
};

export class ResourcesApi {
  constructor(private readonly request: APIRequestContext) {}

  listResources(): Promise<APIResponse> {
    return this.request.get("/api/v1/resources");
  }

  createResource(payload: CreateResourceRequest): Promise<APIResponse> {
    return this.request.post("/api/v1/resources", { data: payload });
  }

  updateResource(id: string, payload: UpdateResourceRequest): Promise<APIResponse> {
    return this.request.patch(`/api/v1/resources/${encodeURIComponent(id)}`, {
      data: payload,
    });
  }

  deleteResource(id: string): Promise<APIResponse> {
    return this.request.delete(`/api/v1/resources/${encodeURIComponent(id)}`);
  }
}

export async function readCreatedResource(
  response: APIResponse,
): Promise<CreatedResource> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Resource response is missing data");
  }

  return parseResource(body.data);
}

export async function readResourceList(
  response: APIResponse,
): Promise<CreatedResource[]> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !Array.isArray(body.data)) {
    throw new Error("Resources list response is missing data");
  }

  return body.data.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Resources list item ${index} is not an object`);
    }

    return parseResource(item);
  });
}

function parseResource(data: Record<string, unknown>): CreatedResource {
  const id = data.id;
  const name = data.name;
  const url = data.url;
  const type = data.type;
  const status = data.status;
  const projectId = data.projectId;
  const projectName = data.projectName;
  const clientId = data.clientId;
  const clientName = data.clientName;

  if (typeof id !== "string" || id.length === 0) {
    throw new Error("Resource response is missing data.id");
  }

  if (typeof name !== "string") {
    throw new Error("Resource response is missing data.name");
  }

  if (typeof url !== "string") {
    throw new Error("Resource response is missing data.url");
  }

  if (!isResourceType(type)) {
    throw new Error("Resource response has an invalid data.type");
  }

  if (!isResourceStatus(status)) {
    throw new Error("Resource response has an invalid data.status");
  }

  if (typeof projectId !== "string" || projectId.length === 0) {
    throw new Error("Resource response is missing data.projectId");
  }

  if (typeof projectName !== "string") {
    throw new Error("Resource response is missing data.projectName");
  }

  if (typeof clientId !== "string" || clientId.length === 0) {
    throw new Error("Resource response is missing data.clientId");
  }

  if (typeof clientName !== "string") {
    throw new Error("Resource response is missing data.clientName");
  }

  return {
    id,
    name,
    url,
    type,
    status,
    projectId,
    projectName,
    clientId,
    clientName,
  };
}

function isResourceType(value: unknown): value is ResourceType {
  return (
    value === "Repository" ||
    value === "API Docs" ||
    value === "Environment" ||
    value === "Test Management" ||
    value === "Documentation" ||
    value === "Other"
  );
}

function isResourceStatus(value: unknown): value is ResourceStatus {
  return value === "Active" || value === "Inactive";
}
