import { NextResponse } from "next/server";

import { changedFieldsMetadata } from "../../../../../server/audit/audit.dto";
import { recordAuditEvent } from "../../../../../server/audit/audit.service";
import { toTaskDTO } from "../../../../../server/tasks/task.dto";
import {
  taskSlugParamSchema,
  updateTaskSchema,
} from "../../../../../server/tasks/task.schema";
import {
  ProjectNotFoundError,
  deleteTaskBySlug,
  getTaskBySlug,
  updateTaskBySlug,
} from "../../../../../server/tasks/task.service";
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

function taskNotFound(): NextResponse {
  return errorResponse(404, "TASK_NOT_FOUND", "Task was not found.");
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;

  if (!taskSlugParamSchema.safeParse(slug).success) {
    return taskNotFound();
  }

  try {
    await requirePermission("tasks:read");
    const row = await getTaskBySlug(slug);

    return row ? NextResponse.json({ data: toTaskDTO(row) }) : taskNotFound();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof ForbiddenError) {
      return forbiddenResponse();
    }

    return internalErrorResponse(`GET /api/v1/tasks/${slug}`, error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;

  if (!taskSlugParamSchema.safeParse(slug).success) {
    return taskNotFound();
  }

  let user: SafeUser;

  try {
    user = await requirePermission("tasks:update");
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

  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const row = await updateTaskBySlug(slug, parsed.data);

    if (!row) {
      return taskNotFound();
    }

    await recordAuditEvent({
      eventType: "TASK_UPDATED",
      entityType: "task",
      action: "updated",
      entityId: row.id,
      entitySlug: row.slug,
      entityLabel: row.title,
      actorUserId: user.id,
      actorName: user.name,
      metadata: changedFieldsMetadata(parsed.data),
    });

    return NextResponse.json({ data: toTaskDTO(row) });
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return errorResponse(400, "PROJECT_NOT_FOUND", "The selected project does not exist.");
    }

    return internalErrorResponse(`PATCH /api/v1/tasks/${slug}`, error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;

  if (!taskSlugParamSchema.safeParse(slug).success) {
    return taskNotFound();
  }

  try {
    const user = await requirePermission("tasks:delete");
    const existing = await getTaskBySlug(slug);

    if (!existing) {
      return taskNotFound();
    }

    const deleted = await deleteTaskBySlug(slug);

    if (!deleted) {
      return taskNotFound();
    }

    await recordAuditEvent({
      eventType: "TASK_DELETED",
      entityType: "task",
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

    return internalErrorResponse(`DELETE /api/v1/tasks/${slug}`, error);
  }
}
