import { randomUUID } from "node:crypto";

import { asc, desc, eq } from "drizzle-orm";

import { db } from "../db";
import { isForeignKeyViolation, isUniqueViolation } from "../db/constraint-errors";
import { clients, notes, projects } from "../db/schema";
import { slugify } from "../slug";
import type { NoteWithRelationsRow } from "./note.dto";
import type { CreateNoteInput, UpdateNoteInput } from "./note.schema";

/** Thrown when a non-empty note title contains nothing a slug can be built from. */
export class NoteTitleNotSluggableError extends Error {
  constructor(title: string) {
    super(`Note title "${title}" cannot be converted into a URL slug.`);
    this.name = "NoteTitleNotSluggableError";
  }
}

/** Thrown when the referenced project does not exist. */
export class ProjectNotFoundError extends Error {
  constructor(readonly projectId: string) {
    super(`Project "${projectId}" does not exist.`);
    this.name = "ProjectNotFoundError";
  }
}

const CREATE_SLUG_ATTEMPTS = 3;

const noteSelection = {
  id: notes.id,
  slug: notes.slug,
  title: notes.title,
  content: notes.content,
  category: notes.category,
  pinned: notes.pinned,
  projectId: notes.projectId,
  author: notes.author,
  createdAt: notes.createdAt,
  updatedAt: notes.updatedAt,
  projectSlug: projects.slug,
  projectName: projects.name,
  clientId: clients.id,
  clientSlug: clients.slug,
  clientName: clients.name,
};

function buildNoteSlug(title: string): string {
  const base = slugify(title);

  if (!base) {
    throw new NoteTitleNotSluggableError(title);
  }

  const suffix = randomUUID().replaceAll("-", "").slice(0, 8);

  return `${base}-${suffix}`;
}

export async function listNotes(): Promise<NoteWithRelationsRow[]> {
  return db
    .select(noteSelection)
    .from(notes)
    .innerJoin(projects, eq(notes.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .orderBy(desc(notes.pinned), asc(notes.createdAt), asc(notes.slug));
}

export async function getNoteBySlug(
  slug: string,
): Promise<NoteWithRelationsRow | null> {
  const [row] = await db
    .select(noteSelection)
    .from(notes)
    .innerJoin(projects, eq(notes.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(notes.slug, slug))
    .limit(1);

  return row ?? null;
}

export async function createNote(
  input: CreateNoteInput,
  author: string,
): Promise<NoteWithRelationsRow> {
  let lastUniqueError: unknown;

  for (let attempt = 0; attempt < CREATE_SLUG_ATTEMPTS; attempt += 1) {
    const slug = buildNoteSlug(input.title);

    try {
      const [row] = await db
        .insert(notes)
        .values({
          slug,
          title: input.title,
          content: input.content,
          category: input.category,
          pinned: input.pinned,
          projectId: input.projectId,
          author,
        })
        .returning({ slug: notes.slug });

      if (!row) {
        throw new Error("Note insert returned no row.");
      }

      const created = await getNoteBySlug(row.slug);

      if (!created) {
        throw new Error("Note disappeared immediately after insert.");
      }

      return created;
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ProjectNotFoundError(input.projectId);
      }

      if (isUniqueViolation(error)) {
        lastUniqueError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastUniqueError ?? new Error("Unable to allocate a unique note slug.");
}

export async function updateNoteBySlug(
  slug: string,
  input: UpdateNoteInput,
): Promise<NoteWithRelationsRow | null> {
  const changes = {
    updatedAt: new Date(),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.content !== undefined && { content: input.content }),
    ...(input.projectId !== undefined && { projectId: input.projectId }),
    ...(input.category !== undefined && { category: input.category }),
    ...(input.pinned !== undefined && { pinned: input.pinned }),
  };

  try {
    const [row] = await db
      .update(notes)
      .set(changes)
      .where(eq(notes.slug, slug))
      .returning({ slug: notes.slug });

    return row ? await getNoteBySlug(row.slug) : null;
  } catch (error) {
    if (isForeignKeyViolation(error) && input.projectId) {
      throw new ProjectNotFoundError(input.projectId);
    }

    throw error;
  }
}

/** Returns true when a row was deleted, false when the slug did not exist. */
export async function deleteNoteBySlug(slug: string): Promise<boolean> {
  const deleted = await db
    .delete(notes)
    .where(eq(notes.slug, slug))
    .returning({ slug: notes.slug });

  return deleted.length > 0;
}
