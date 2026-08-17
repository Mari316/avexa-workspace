import { asc, eq } from "drizzle-orm";

import { db } from "../db";
import { isForeignKeyViolation, isUniqueViolation } from "../db/constraint-errors";
import { clients, projects } from "../db/schema";
import { slugify } from "../slug";
import type { ProjectWithClientRow } from "./project.dto";
import type { CreateProjectInput, UpdateProjectInput } from "./project.schema";

/** Thrown when a non-empty project name contains nothing a slug can be built from. */
export class ProjectNameNotSluggableError extends Error {
  constructor(name: string) {
    super(`Project name "${name}" cannot be converted into a URL slug.`);
    this.name = "ProjectNameNotSluggableError";
  }
}

/** Thrown when the generated slug is already taken. Slugs are never auto-suffixed. */
export class ProjectSlugConflictError extends Error {
  constructor(readonly slug: string) {
    super(`A project with the slug "${slug}" already exists.`);
    this.name = "ProjectSlugConflictError";
  }
}

/** Thrown when the referenced client does not exist. */
export class ClientNotFoundError extends Error {
  constructor(readonly clientId: string) {
    super(`Client "${clientId}" does not exist.`);
    this.name = "ClientNotFoundError";
  }
}

const projectSelection = {
  id: projects.id,
  slug: projects.slug,
  name: projects.name,
  clientId: projects.clientId,
  environment: projects.environment,
  status: projects.status,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
  clientSlug: clients.slug,
  clientName: clients.name,
};

export async function listProjects(): Promise<ProjectWithClientRow[]> {
  return db
    .select(projectSelection)
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .orderBy(asc(projects.createdAt), asc(projects.slug));
}

export async function getProjectBySlug(
  slug: string,
): Promise<ProjectWithClientRow | null> {
  const [row] = await db
    .select(projectSelection)
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.slug, slug))
    .limit(1);

  return row ?? null;
}

export async function createProject(
  input: CreateProjectInput,
): Promise<ProjectWithClientRow> {
  const slug = slugify(input.name);

  if (!slug) {
    throw new ProjectNameNotSluggableError(input.name);
  }

  try {
    const [row] = await db
      .insert(projects)
      .values({
        slug,
        name: input.name,
        clientId: input.clientId,
        environment: input.environment,
        status: input.status,
      })
      .returning({ slug: projects.slug });

    if (!row) {
      throw new Error("Project insert returned no row.");
    }

    const created = await getProjectBySlug(row.slug);

    if (!created) {
      throw new Error("Project disappeared immediately after insert.");
    }

    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ProjectSlugConflictError(slug);
    }

    if (isForeignKeyViolation(error)) {
      throw new ClientNotFoundError(input.clientId);
    }

    throw error;
  }
}

export async function updateProjectBySlug(
  slug: string,
  input: UpdateProjectInput,
): Promise<ProjectWithClientRow | null> {
  const changes = {
    updatedAt: new Date(),
    ...(input.name !== undefined && { name: input.name }),
    ...(input.clientId !== undefined && { clientId: input.clientId }),
    ...(input.environment !== undefined && { environment: input.environment }),
    ...(input.status !== undefined && { status: input.status }),
  };

  try {
    const [row] = await db
      .update(projects)
      .set(changes)
      .where(eq(projects.slug, slug))
      .returning({ slug: projects.slug });

    return row ? await getProjectBySlug(row.slug) : null;
  } catch (error) {
    if (isForeignKeyViolation(error) && input.clientId) {
      throw new ClientNotFoundError(input.clientId);
    }

    throw error;
  }
}
