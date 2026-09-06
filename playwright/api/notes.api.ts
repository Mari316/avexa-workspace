import type { APIRequestContext, APIResponse } from "@playwright/test";

import type {
  CreateNoteRequest,
  NoteCategory,
  UpdateNoteRequest,
} from "../data/note.factory.js";
import { isRecord } from "./errors.js";

export type CreatedNote = {
  slug: string;
  title: string;
  content: string;
  projectId: string;
  clientId: string;
  category: NoteCategory;
  pinned: boolean;
  author: string;
};

export class NotesApi {
  constructor(private readonly request: APIRequestContext) {}

  listNotes(): Promise<APIResponse> {
    return this.request.get("/api/v1/notes");
  }

  createNote(payload: CreateNoteRequest): Promise<APIResponse> {
    return this.request.post("/api/v1/notes", { data: payload });
  }

  getNote(slug: string): Promise<APIResponse> {
    return this.request.get(`/api/v1/notes/${encodeURIComponent(slug)}`);
  }

  updateNote(slug: string, payload: UpdateNoteRequest): Promise<APIResponse> {
    return this.request.patch(`/api/v1/notes/${encodeURIComponent(slug)}`, {
      data: payload,
    });
  }

  deleteNote(slug: string): Promise<APIResponse> {
    return this.request.delete(`/api/v1/notes/${encodeURIComponent(slug)}`);
  }
}

export async function readCreatedNote(
  response: APIResponse,
): Promise<CreatedNote> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Note response is missing data");
  }

  return parseNote(body.data);
}

export async function readNoteList(
  response: APIResponse,
): Promise<CreatedNote[]> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !Array.isArray(body.data)) {
    throw new Error("Notes list response is missing data");
  }

  return body.data.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Notes list item ${index} is not an object`);
    }

    return parseNote(item);
  });
}

function parseNote(data: Record<string, unknown>): CreatedNote {
  const slug = data.slug;
  const title = data.title;
  const content = data.content;
  const projectId = data.projectId;
  const clientId = data.clientId;
  const category = data.category;
  const pinned = data.pinned;
  const author = data.author;

  if (typeof slug !== "string" || slug.length === 0) {
    throw new Error("Note response is missing data.slug");
  }

  if (typeof title !== "string") {
    throw new Error("Note response is missing data.title");
  }

  if (typeof content !== "string") {
    throw new Error("Note response is missing data.content");
  }

  if (typeof projectId !== "string" || projectId.length === 0) {
    throw new Error("Note response is missing data.projectId");
  }

  if (typeof clientId !== "string" || clientId.length === 0) {
    throw new Error("Note response is missing data.clientId");
  }

  if (!isNoteCategory(category)) {
    throw new Error("Note response has an invalid data.category");
  }

  if (typeof pinned !== "boolean") {
    throw new Error("Note response is missing data.pinned");
  }

  if (typeof author !== "string" || author.length === 0) {
    throw new Error("Note response is missing data.author");
  }

  return { slug, title, content, projectId, clientId, category, pinned, author };
}

function isNoteCategory(value: unknown): value is NoteCategory {
  return (
    value === "Testing" ||
    value === "Automation" ||
    value === "Investigation" ||
    value === "Bug" ||
    value === "General"
  );
}
