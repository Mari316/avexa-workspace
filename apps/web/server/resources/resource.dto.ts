import type { ResourceRow } from "../db/schema";

/**
 * Client is denormalized through the Project→Client join. Client is never stored
 * on the resource row; changing a project's client updates every resource DTO
 * that belongs to that project without rewriting resource rows.
 */
export type ResourceDTO = {
  id: string;
  name: string;
  url: string;
  type: ResourceRow["type"];
  status: ResourceRow["status"];
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
};

export type ResourceWithRelationsRow = ResourceRow & {
  projectName: string;
  clientId: string;
  clientName: string;
};

export function toResourceDTO(row: ResourceWithRelationsRow): ResourceDTO {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    type: row.type,
    status: row.status,
    projectId: row.projectId,
    projectName: row.projectName,
    clientId: row.clientId,
    clientName: row.clientName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
