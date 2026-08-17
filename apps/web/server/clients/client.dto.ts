import type { ClientRow } from "../db/schema";

export type ClientDTO = {
  id: string;
  slug: string;
  name: string;
  status: ClientRow["status"];
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
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
