import { NextResponse } from "next/server";

import { toResourceDTO } from "../../../../../server/resources/resource.dto";
import {
  resourceIdParamSchema,
  updateResourceSchema,
} from "../../../../../server/resources/resource.schema";
import {
  ProjectNotFoundError,
  deleteResourceById,
  updateResourceById,
} from "../../../../../server/resources/resource.service";
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
  params: Promise<{ id: string }>;
};

function resourceNotFound(): NextResponse {
  return errorResponse(404, "RESOURCE_NOT_FOUND", "Resource was not found.");
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;

  if (!resourceIdParamSchema.safeParse(id).success) {
    return resourceNotFound();
  }

  try {
    await requirePermission("resources:update");
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

  const parsed = updateResourceSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const row = await updateResourceById(id, parsed.data);

    if (!row) {
      return resourceNotFound();
    }

    return NextResponse.json({ data: toResourceDTO(row) });
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return errorResponse(400, "PROJECT_NOT_FOUND", "The selected project does not exist.");
    }

    return internalErrorResponse(`PATCH /api/v1/resources/${id}`, error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;

  if (!resourceIdParamSchema.safeParse(id).success) {
    return resourceNotFound();
  }

  try {
    await requirePermission("resources:delete");
    const deleted = await deleteResourceById(id);

    if (!deleted) {
      return resourceNotFound();
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof ForbiddenError) {
      return forbiddenResponse();
    }

    return internalErrorResponse(`DELETE /api/v1/resources/${id}`, error);
  }
}
