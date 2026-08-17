import type { ProjectRow } from "../db/schema";

/**
 * Client is denormalized on reads because every Projects surface shows it.
 * Writes still accept `clientId` only.
 */
export type ProjectDTO = {
  id: string;
  slug: string;
  name: string;
  clientId: string;
  clientSlug: string;
  clientName: string;
  environment: ProjectRow["environment"];
  status: ProjectRow["status"];
  createdAt: string;
  updatedAt: string;
};

export type ProjectWithClientRow = ProjectRow & {
  clientSlug: string;
  clientName: string;
};

export function toProjectDTO(row: ProjectWithClientRow): ProjectDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    clientId: row.clientId,
    clientSlug: row.clientSlug,
    clientName: row.clientName,
    environment: row.environment,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
