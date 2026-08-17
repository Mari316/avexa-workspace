import { NextResponse } from "next/server";

import { toTaskDTO } from "../../../../server/tasks/task.dto";
import { createTaskSchema } from "../../../../server/tasks/task.schema";
import {
  ProjectNotFoundError,
  TaskSlugConflictError,
  TaskTitleNotSluggableError,
  createTask,
  listTasks,
} from "../../../../server/tasks/task.service";
import {
  UnauthorizedError,
  requireUser,
} from "../../../../server/auth/require-user";
import {
  errorResponse,
  internalErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "../../../../server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    await requireUser();
    const rows = await listTasks();

    return NextResponse.json({ data: rows.map(toTaskDTO) });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    return internalErrorResponse("GET /api/v1/tasks", error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
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

  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const row = await createTask(parsed.data);

    return NextResponse.json(
      { data: toTaskDTO(row) },
      { status: 201, headers: { Location: `/api/v1/tasks/${row.slug}` } },
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof TaskTitleNotSluggableError) {
      return errorResponse(
        400,
        "TASK_TITLE_NOT_SLUGGABLE",
        "Task title must contain letters or numbers.",
      );
    }

    if (error instanceof ProjectNotFoundError) {
      return errorResponse(400, "PROJECT_NOT_FOUND", "The selected project does not exist.");
    }

    if (error instanceof TaskSlugConflictError) {
      return errorResponse(
        409,
        "TASK_SLUG_CONFLICT",
        "A task with this title already exists.",
      );
    }

    return internalErrorResponse("POST /api/v1/tasks", error);
  }
}
