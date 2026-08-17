import { asc, eq } from "drizzle-orm";

import { db } from "../db";
import { isForeignKeyViolation, isUniqueViolation } from "../db/constraint-errors";
import { clients, projects, tasks } from "../db/schema";
import { slugify } from "../slug";
import type { TaskWithRelationsRow } from "./task.dto";
import type { CreateTaskInput, UpdateTaskInput } from "./task.schema";

/** Thrown when a non-empty task title contains nothing a slug can be built from. */
export class TaskTitleNotSluggableError extends Error {
  constructor(title: string) {
    super(`Task title "${title}" cannot be converted into a URL slug.`);
    this.name = "TaskTitleNotSluggableError";
  }
}

/** Thrown when the generated slug is already taken. Slugs are never auto-suffixed. */
export class TaskSlugConflictError extends Error {
  constructor(readonly slug: string) {
    super(`A task with the slug "${slug}" already exists.`);
    this.name = "TaskSlugConflictError";
  }
}

/** Thrown when the referenced project does not exist. */
export class ProjectNotFoundError extends Error {
  constructor(readonly projectId: string) {
    super(`Project "${projectId}" does not exist.`);
    this.name = "ProjectNotFoundError";
  }
}

const taskSelection = {
  id: tasks.id,
  slug: tasks.slug,
  title: tasks.title,
  projectId: tasks.projectId,
  assignee: tasks.assignee,
  dueDate: tasks.dueDate,
  priority: tasks.priority,
  status: tasks.status,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
  projectSlug: projects.slug,
  projectName: projects.name,
  clientId: clients.id,
  clientSlug: clients.slug,
  clientName: clients.name,
};

export async function listTasks(): Promise<TaskWithRelationsRow[]> {
  return db
    .select(taskSelection)
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .orderBy(asc(tasks.createdAt), asc(tasks.slug));
}

export async function getTaskBySlug(
  slug: string,
): Promise<TaskWithRelationsRow | null> {
  const [row] = await db
    .select(taskSelection)
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(tasks.slug, slug))
    .limit(1);

  return row ?? null;
}

export async function createTask(input: CreateTaskInput): Promise<TaskWithRelationsRow> {
  const slug = slugify(input.title);

  if (!slug) {
    throw new TaskTitleNotSluggableError(input.title);
  }

  try {
    const [row] = await db
      .insert(tasks)
      .values({
        slug,
        title: input.title,
        projectId: input.projectId,
        assignee: input.assignee,
        dueDate: input.dueDate,
        priority: input.priority,
        status: input.status,
      })
      .returning({ slug: tasks.slug });

    if (!row) {
      throw new Error("Task insert returned no row.");
    }

    const created = await getTaskBySlug(row.slug);

    if (!created) {
      throw new Error("Task disappeared immediately after insert.");
    }

    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new TaskSlugConflictError(slug);
    }

    if (isForeignKeyViolation(error)) {
      throw new ProjectNotFoundError(input.projectId);
    }

    throw error;
  }
}

export async function updateTaskBySlug(
  slug: string,
  input: UpdateTaskInput,
): Promise<TaskWithRelationsRow | null> {
  const changes = {
    updatedAt: new Date(),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.projectId !== undefined && { projectId: input.projectId }),
    ...(input.assignee !== undefined && { assignee: input.assignee }),
    ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
    ...(input.priority !== undefined && { priority: input.priority }),
    ...(input.status !== undefined && { status: input.status }),
  };

  try {
    const [row] = await db
      .update(tasks)
      .set(changes)
      .where(eq(tasks.slug, slug))
      .returning({ slug: tasks.slug });

    return row ? await getTaskBySlug(row.slug) : null;
  } catch (error) {
    if (isForeignKeyViolation(error) && input.projectId) {
      throw new ProjectNotFoundError(input.projectId);
    }

    throw error;
  }
}

/** Returns true when a row was deleted, false when the slug did not exist. */
export async function deleteTaskBySlug(slug: string): Promise<boolean> {
  const deleted = await db
    .delete(tasks)
    .where(eq(tasks.slug, slug))
    .returning({ slug: tasks.slug });

  return deleted.length > 0;
}
