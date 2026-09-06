export type NoteCategory =
  | "Testing"
  | "Automation"
  | "Investigation"
  | "Bug"
  | "General";

export type CreateNoteRequest = {
  title: string;
  content: string;
  projectId: string;
  category: NoteCategory;
  pinned: boolean;
};

export type UpdateNoteRequest = {
  title?: string;
  content?: string;
  projectId?: string;
  category?: NoteCategory;
  pinned?: boolean;
};

export type BuildNoteInput = {
  projectId: string;
} & Partial<Omit<CreateNoteRequest, "projectId">>;

export function buildNote(input: BuildNoteInput): CreateNoteRequest {
  return {
    projectId: input.projectId,
    title: input.title ?? `PW note ${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    content:
      input.content ??
      "Recorded during Playwright coverage for the persistent Notes feature.",
    category: input.category ?? "Testing",
    pinned: input.pinned ?? false,
  };
}
