import { NextResponse } from "next/server";

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
  UnauthorizedError,
  requireUser,
} from "../../../../../server/auth/require-user";
import {
  errorResponse,
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
    await requireUser();
    const row = await getTaskBySlug(slug);

    return row ? NextResponse.json({ data: toTaskDTO(row) }) : taskNotFound();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
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

  try {
    await requireUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    return internalErrorResponse("requireUser", error);
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

    return row ? NextResponse.json({ data: toTaskDTO(row) }) : taskNotFound();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

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
    await requireUser();
    const deleted = await deleteTaskBySlug(slug);

    return deleted ? new NextResponse(null, { status: 204 }) : taskNotFound();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    return internalErrorResponse(`DELETE /api/v1/tasks/${slug}`, error);
  }
}
