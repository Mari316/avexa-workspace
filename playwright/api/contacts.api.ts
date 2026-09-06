import type { APIRequestContext, APIResponse } from "@playwright/test";

import type {
  ContactStatus,
  CreateContactRequest,
  UpdateContactRequest,
} from "../data/contact.factory.js";

export type CreatedContact = {
  slug: string;
  firstName: string;
  lastName: string;
  clientId: string;
  email: string;
  role: string;
  status: ContactStatus;
};

export class ContactsApi {
  constructor(private readonly request: APIRequestContext) {}

  createContact(payload: CreateContactRequest): Promise<APIResponse> {
    return this.request.post("/api/v1/contacts", { data: payload });
  }

  getContact(slug: string): Promise<APIResponse> {
    return this.request.get(`/api/v1/contacts/${encodeURIComponent(slug)}`);
  }

  updateContact(slug: string, payload: UpdateContactRequest): Promise<APIResponse> {
    return this.request.patch(`/api/v1/contacts/${encodeURIComponent(slug)}`, {
      data: payload,
    });
  }
}

export async function readCreatedContact(
  response: APIResponse,
): Promise<CreatedContact> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Contact response is missing data");
  }

  const slug = body.data.slug;
  const firstName = body.data.firstName;
  const lastName = body.data.lastName;
  const clientId = body.data.clientId;
  const email = body.data.email;
  const role = body.data.role;
  const status = body.data.status;

  if (typeof slug !== "string" || slug.length === 0) {
    throw new Error("Contact response is missing data.slug");
  }

  if (typeof firstName !== "string") {
    throw new Error("Contact response is missing data.firstName");
  }

  if (typeof lastName !== "string") {
    throw new Error("Contact response is missing data.lastName");
  }

  if (typeof clientId !== "string" || clientId.length === 0) {
    throw new Error("Contact response is missing data.clientId");
  }

  if (typeof email !== "string") {
    throw new Error("Contact response is missing data.email");
  }

  if (typeof role !== "string") {
    throw new Error("Contact response is missing data.role");
  }

  if (!isContactStatus(status)) {
    throw new Error("Contact response has an invalid data.status");
  }

  return { slug, firstName, lastName, clientId, email, role, status };
}

function isContactStatus(value: unknown): value is ContactStatus {
  return value === "Active" || value === "Inactive";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
