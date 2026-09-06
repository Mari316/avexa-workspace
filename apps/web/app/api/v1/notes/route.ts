import { NextResponse } from "next/server";

import { toNoteDTO } from "../../../../server/notes/note.dto";
import { createNoteSchema } from "../../../../server/notes/note.schema";
import {
  NoteTitleNotSluggableError,
  ProjectNotFoundError,
  createNote,
  listNotes,
} from "../../../../server/notes/note.service";
import {
  ForbiddenError,
  requirePermission,
} from "../../../../server/auth/require-permission";
import { UnauthorizedError } from "../../../../server/auth/require-user";
import {
  errorResponse,
  forbiddenResponse,
  internalErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "../../../../server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    await requirePermission("notes:read");
    const rows = await listNotes();

    return NextResponse.json({ data: rows.map(toNoteDTO) });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof ForbiddenError) {
      return forbiddenResponse();
    }

    return internalErrorResponse("GET /api/v1/notes", error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let author: string;

  try {
    const user = await requirePermission("notes:create");
    author = user.name;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof ForbiddenError) {
      return forbiddenResponse();
    }

    return internalErrorResponse("requirePermission", error);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Request body must be valid JSON.");
  }

  const parsed = createNoteSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const row = await createNote(parsed.data, author);

    return NextResponse.json(
      { data: toNoteDTO(row) },
      { status: 201, headers: { Location: `/api/v1/notes/${row.slug}` } },
    );
  } catch (error) {
    if (error instanceof NoteTitleNotSluggableError) {
      return errorResponse(
        400,
        "NOTE_TITLE_NOT_SLUGGABLE",
        "Note title must contain letters or numbers.",
      );
    }

    if (error instanceof ProjectNotFoundError) {
      return errorResponse(400, "PROJECT_NOT_FOUND", "The selected project does not exist.");
    }

    return internalErrorResponse("POST /api/v1/notes", error);
  }
}
