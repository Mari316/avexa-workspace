import { NextResponse } from "next/server";

import { changedFieldsMetadata } from "../../../../../server/audit/audit.dto";
import { recordAuditEvent } from "../../../../../server/audit/audit.service";
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
import { UnauthorizedError, type SafeUser } from "../../../../../server/auth/require-user";
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

  let user: SafeUser;

  try {
    user = await requirePermission("notes:update");
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

    if (!row) {
      return noteNotFound();
    }

    await recordAuditEvent({
      eventType: "NOTE_UPDATED",
      entityType: "note",
      action: "updated",
      entityId: row.id,
      entitySlug: row.slug,
      entityLabel: row.title,
      actorUserId: user.id,
      actorName: user.name,
      metadata: changedFieldsMetadata(parsed.data),
    });

    return NextResponse.json({ data: toNoteDTO(row) });
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
    const user = await requirePermission("notes:delete");
    const existing = await getNoteBySlug(slug);

    if (!existing) {
      return noteNotFound();
    }

    const deleted = await deleteNoteBySlug(slug);

    if (!deleted) {
      return noteNotFound();
    }

    await recordAuditEvent({
      eventType: "NOTE_DELETED",
      entityType: "note",
      action: "deleted",
      entityId: existing.id,
      entitySlug: existing.slug,
      entityLabel: existing.title,
      actorUserId: user.id,
      actorName: user.name,
      metadata: {},
    });

    return new NextResponse(null, { status: 204 });
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
