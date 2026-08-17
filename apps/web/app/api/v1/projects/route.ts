import { NextResponse } from "next/server";

import { toProjectDTO } from "../../../../server/projects/project.dto";
import { createProjectSchema } from "../../../../server/projects/project.schema";
import {
  ClientNotFoundError,
  ProjectNameNotSluggableError,
  ProjectSlugConflictError,
  createProject,
  listProjects,
} from "../../../../server/projects/project.service";
import {
  errorResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "../../../../server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await listProjects();

    return NextResponse.json({ data: rows.map(toProjectDTO) });
  } catch (error) {
    return internalErrorResponse("GET /api/v1/projects", error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Request body must be valid JSON.");
  }

  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const row = await createProject(parsed.data);

    return NextResponse.json(
      { data: toProjectDTO(row) },
      { status: 201, headers: { Location: `/api/v1/projects/${row.slug}` } },
    );
  } catch (error) {
    if (error instanceof ProjectNameNotSluggableError) {
      return errorResponse(
        400,
        "PROJECT_NAME_NOT_SLUGGABLE",
        "Project name must contain letters or numbers.",
      );
    }

    if (error instanceof ClientNotFoundError) {
      return errorResponse(400, "CLIENT_NOT_FOUND", "The selected client does not exist.");
    }

    if (error instanceof ProjectSlugConflictError) {
      return errorResponse(
        409,
        "PROJECT_SLUG_CONFLICT",
        "A project with this name already exists.",
      );
    }

    return internalErrorResponse("POST /api/v1/projects", error);
  }
}
