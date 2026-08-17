import type { ContactDTO } from "../../server/contacts/contact.dto";
import { request } from "./request";

export type { ContactDTO };

export type CreateContactBody = {
  firstName: string;
  lastName: string;
  clientId: string;
  email: string;
  role: string;
  status?: ContactDTO["status"];
};

export type UpdateContactBody = {
  firstName?: string;
  lastName?: string;
  clientId?: string;
  email?: string;
  role?: string;
  status?: ContactDTO["status"];
};

const CONTACTS_URL = "/api/v1/contacts";

export function listContacts(): Promise<ContactDTO[]> {
  return request<ContactDTO[]>(CONTACTS_URL);
}

export function createContact(body: CreateContactBody): Promise<ContactDTO> {
  return request<ContactDTO>(CONTACTS_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateContact(
  slug: string,
  body: UpdateContactBody,
): Promise<ContactDTO> {
  return request<ContactDTO>(`${CONTACTS_URL}/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
