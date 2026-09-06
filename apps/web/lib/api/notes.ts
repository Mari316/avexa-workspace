import type { NoteDTO } from "../../server/notes/note.dto";
import { request } from "./request";

export type { NoteDTO };

export type CreateNoteBody = {
  title: string;
  content: string;
  projectId: string;
  category: NoteDTO["category"];
  pinned?: boolean;
};

export type UpdateNoteBody = {
  title?: string;
  content?: string;
  projectId?: string;
  category?: NoteDTO["category"];
  pinned?: boolean;
};

const NOTES_URL = "/api/v1/notes";

export function listNotes(): Promise<NoteDTO[]> {
  return request<NoteDTO[]>(NOTES_URL);
}

export function createNote(body: CreateNoteBody): Promise<NoteDTO> {
  return request<NoteDTO>(NOTES_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateNote(slug: string, body: UpdateNoteBody): Promise<NoteDTO> {
  return request<NoteDTO>(`${NOTES_URL}/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteNote(slug: string): Promise<void> {
  return request<void>(`${NOTES_URL}/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}
