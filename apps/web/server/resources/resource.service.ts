import { asc, eq } from "drizzle-orm";

import { db } from "../db";
import { isForeignKeyViolation } from "../db/constraint-errors";
import { clients, projects, resources } from "../db/schema";
import type { ResourceWithRelationsRow } from "./resource.dto";
import type { CreateResourceInput, UpdateResourceInput } from "./resource.schema";

/** Thrown when the referenced project does not exist. */
export class ProjectNotFoundError extends Error {
  constructor(readonly projectId: string) {
    super(`Project "${projectId}" does not exist.`);
    this.name = "ProjectNotFoundError";
  }
}

const resourceSelection = {
  id: resources.id,
  name: resources.name,
  url: resources.url,
  type: resources.type,
  status: resources.status,
  projectId: resources.projectId,
  createdAt: resources.createdAt,
  updatedAt: resources.updatedAt,
  projectName: projects.name,
  clientId: clients.id,
  clientName: clients.name,
};

export async function listResources(): Promise<ResourceWithRelationsRow[]> {
  return db
    .select(resourceSelection)
    .from(resources)
    .innerJoin(projects, eq(resources.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .orderBy(asc(resources.name), asc(resources.id));
}

export async function getResourceById(
  id: string,
): Promise<ResourceWithRelationsRow | null> {
  const [row] = await db
    .select(resourceSelection)
    .from(resources)
    .innerJoin(projects, eq(resources.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(resources.id, id))
    .limit(1);

  return row ?? null;
}

export async function createResource(
  input: CreateResourceInput,
): Promise<ResourceWithRelationsRow> {
  try {
    const [row] = await db
      .insert(resources)
      .values({
        name: input.name,
        url: input.url,
        type: input.type,
        status: input.status ?? "Active",
        projectId: input.projectId,
      })
      .returning({ id: resources.id });

    if (!row) {
      throw new Error("Resource insert returned no row.");
    }

    const created = await getResourceById(row.id);

    if (!created) {
      throw new Error("Resource disappeared immediately after insert.");
    }

    return created;
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      throw new ProjectNotFoundError(input.projectId);
    }

    throw error;
  }
}

export async function updateResourceById(
  id: string,
  input: UpdateResourceInput,
): Promise<ResourceWithRelationsRow | null> {
  const changes = {
    updatedAt: new Date(),
    ...(input.name !== undefined && { name: input.name }),
    ...(input.url !== undefined && { url: input.url }),
    ...(input.type !== undefined && { type: input.type }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.projectId !== undefined && { projectId: input.projectId }),
  };

  try {
    const [row] = await db
      .update(resources)
      .set(changes)
      .where(eq(resources.id, id))
      .returning({ id: resources.id });

    return row ? await getResourceById(row.id) : null;
  } catch (error) {
    if (isForeignKeyViolation(error) && input.projectId) {
      throw new ProjectNotFoundError(input.projectId);
    }

    throw error;
  }
}

/** Returns true when a row was deleted, false when the id did not exist. */
export async function deleteResourceById(id: string): Promise<boolean> {
  const deleted = await db
    .delete(resources)
    .where(eq(resources.id, id))
    .returning({ id: resources.id });

  return deleted.length > 0;
}
