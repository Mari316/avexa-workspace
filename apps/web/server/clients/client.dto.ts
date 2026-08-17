import type { ClientRow } from "../db/schema";

export type ClientDTO = {
  id: string;
  slug: string;
  name: string;
  status: ClientRow["status"];
  /** Null when no primary contact is selected. The contact always belongs to this client. */
  primaryContactId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** The single place a database row becomes wire data, including ISO 8601 timestamps. */
export function toClientDTO(row: ClientRow): ClientDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    primaryContactId: row.primaryContactId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
