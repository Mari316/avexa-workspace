import type { NoteRow } from "../db/schema";

/**
 * Client is denormalized through the Project→Client join. Client is never stored
 * on the note row; changing a project's client updates every note DTO that
 * belongs to that project without rewriting note rows.
 */
export type NoteDTO = {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: NoteRow["category"];
  pinned: boolean;
  projectId: string;
  projectSlug: string;
  projectName: string;
  clientId: string;
  clientSlug: string;
  clientName: string;
  author: string;
  createdAt: string;
  updatedAt: string;
};

export type NoteWithRelationsRow = NoteRow & {
  projectSlug: string;
  projectName: string;
  clientId: string;
  clientSlug: string;
  clientName: string;
};

export function toNoteDTO(row: NoteWithRelationsRow): NoteDTO {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    category: row.category,
    pinned: row.pinned,
    projectId: row.projectId,
    projectSlug: row.projectSlug,
    projectName: row.projectName,
    clientId: row.clientId,
    clientSlug: row.clientSlug,
    clientName: row.clientName,
    author: row.author,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
