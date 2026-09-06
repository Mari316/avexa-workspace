import { NextResponse } from "next/server";

import { toNoteDTO } from "../../../../../server/notes/note.dto";
import {
  noteSlugParamSchema,
  updateNoteSchema,
} from "../../../../../server/notes/note.schema";
import {
  ProjectNotFoundError,
  deleteNoteBySlug,
  getNoteBySlug,
  updateNoteBySlug,
} from "../../../../../server/notes/note.service";
import {
  ForbiddenError,
  requirePermission,
} from "../../../../../server/auth/require-permission";
import { UnauthorizedError } from "../../../../../server/auth/require-user";
import {
  errorResponse,
  forbiddenResponse,
  internalErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "../../../../../server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function noteNotFound(): NextResponse {
  return errorResponse(404, "NOTE_NOT_FOUND", "Note was not found.");
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;

  if (!noteSlugParamSchema.safeParse(slug).success) {
    return noteNotFound();
  }

  try {
    await requirePermission("notes:read");
    const row = await getNoteBySlug(slug);

    return row ? NextResponse.json({ data: toNoteDTO(row) }) : noteNotFound();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof ForbiddenError) {
      return forbiddenResponse();
    }

    return internalErrorResponse(`GET /api/v1/notes/${slug}`, error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;

  if (!noteSlugParamSchema.safeParse(slug).success) {
    return noteNotFound();
  }

  try {
    await requirePermission("notes:update");
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

  const parsed = updateNoteSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const row = await updateNoteBySlug(slug, parsed.data);

    return row ? NextResponse.json({ data: toNoteDTO(row) }) : noteNotFound();
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return errorResponse(400, "PROJECT_NOT_FOUND", "The selected project does not exist.");
    }

    return internalErrorResponse(`PATCH /api/v1/notes/${slug}`, error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;

  if (!noteSlugParamSchema.safeParse(slug).success) {
    return noteNotFound();
  }

  try {
    await requirePermission("notes:delete");
    const deleted = await deleteNoteBySlug(slug);

    return deleted ? new NextResponse(null, { status: 204 }) : noteNotFound();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof ForbiddenError) {
      return forbiddenResponse();
    }

    return internalErrorResponse(`DELETE /api/v1/notes/${slug}`, error);
  }
}
