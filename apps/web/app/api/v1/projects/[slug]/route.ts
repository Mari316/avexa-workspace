import { NextResponse } from "next/server";

import { toProjectDTO } from "../../../../../server/projects/project.dto";
import {
  projectSlugParamSchema,
  updateProjectSchema,
} from "../../../../../server/projects/project.schema";
import {
  ClientNotFoundError,
  getProjectBySlug,
  updateProjectBySlug,
} from "../../../../../server/projects/project.service";
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

function projectNotFound(): NextResponse {
  return errorResponse(404, "PROJECT_NOT_FOUND", "Project was not found.");
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;

  if (!projectSlugParamSchema.safeParse(slug).success) {
    return projectNotFound();
  }

  try {
    await requirePermission("projects:read");
    const row = await getProjectBySlug(slug);

    return row ? NextResponse.json({ data: toProjectDTO(row) }) : projectNotFound();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof ForbiddenError) {
      return forbiddenResponse();
    }

    return internalErrorResponse(`GET /api/v1/projects/${slug}`, error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;

  if (!projectSlugParamSchema.safeParse(slug).success) {
    return projectNotFound();
  }

  try {
    await requirePermission("projects:update");
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

  const parsed = updateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const row = await updateProjectBySlug(slug, parsed.data);

    return row ? NextResponse.json({ data: toProjectDTO(row) }) : projectNotFound();
  } catch (error) {
    if (error instanceof ClientNotFoundError) {
      return errorResponse(400, "CLIENT_NOT_FOUND", "The selected client does not exist.");
    }

    return internalErrorResponse(`PATCH /api/v1/projects/${slug}`, error);
  }
}
