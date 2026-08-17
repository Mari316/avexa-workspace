import type { ContactRow } from "../db/schema";

/**
 * The client is denormalized into the read shape because it is mandatory and rendered
 * on every contacts surface, which lets a contact page render without also waiting for
 * the clients request. Writes still accept `clientId` only.
 */
export type ContactDTO = {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  clientId: string;
  clientSlug: string;
  clientName: string;
  email: string;
  role: string;
  status: ContactRow["status"];
  createdAt: string;
  updatedAt: string;
};

export type ContactWithClientRow = ContactRow & {
  clientSlug: string;
  clientName: string;
};

/** The single place a database row becomes wire data, including ISO 8601 timestamps. */
export function toContactDTO(row: ContactWithClientRow): ContactDTO {
  return {
    id: row.id,
    slug: row.slug,
    firstName: row.firstName,
    lastName: row.lastName,
    clientId: row.clientId,
    clientSlug: row.clientSlug,
    clientName: row.clientName,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
