import type { APIRequestContext, APIResponse } from "@playwright/test";

import type {
  ClientStatus,
  CreateClientRequest,
  UpdateClientRequest,
} from "../data/client.factory.js";

export type CreatedClient = {
  id: string;
  slug: string;
  name: string;
  status: ClientStatus;
};

export class ClientsApi {
  constructor(private readonly request: APIRequestContext) {}

  createClient(payload: CreateClientRequest): Promise<APIResponse> {
    return this.request.post("/api/v1/clients", { data: payload });
  }

  getClient(slug: string): Promise<APIResponse> {
    return this.request.get(`/api/v1/clients/${encodeURIComponent(slug)}`);
  }

  updateClient(slug: string, payload: UpdateClientRequest): Promise<APIResponse> {
    return this.request.patch(`/api/v1/clients/${encodeURIComponent(slug)}`, {
      data: payload,
    });
  }
}

export async function readCreatedClient(
  response: APIResponse,
): Promise<CreatedClient> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Client response is missing data");
  }

  const id = body.data.id;
  const slug = body.data.slug;
  const name = body.data.name;
  const status = body.data.status;

  if (typeof id !== "string" || id.length === 0) {
    throw new Error("Client response is missing data.id");
  }

  if (typeof slug !== "string" || slug.length === 0) {
    throw new Error("Client response is missing data.slug");
  }

  if (typeof name !== "string") {
    throw new Error("Client response is missing data.name");
  }

  if (!isClientStatus(status)) {
    throw new Error("Client response has an invalid data.status");
  }

  return { id, slug, name, status };
}

function isClientStatus(value: unknown): value is ClientStatus {
  return value === "Active" || value === "On Hold";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
