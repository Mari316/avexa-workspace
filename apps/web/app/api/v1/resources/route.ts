import { NextResponse } from "next/server";

import { toResourceDTO } from "../../../../server/resources/resource.dto";
import { createResourceSchema } from "../../../../server/resources/resource.schema";
import {
  ProjectNotFoundError,
  createResource,
  listResources,
} from "../../../../server/resources/resource.service";
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
    await requirePermission("resources:read");
    const rows = await listResources();

    return NextResponse.json({ data: rows.map(toResourceDTO) });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof ForbiddenError) {
      return forbiddenResponse();
    }

    return internalErrorResponse("GET /api/v1/resources", error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requirePermission("resources:create");
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

  const parsed = createResourceSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const row = await createResource(parsed.data);

    return NextResponse.json({ data: toResourceDTO(row) }, { status: 201 });
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return errorResponse(400, "PROJECT_NOT_FOUND", "The selected project does not exist.");
    }

    return internalErrorResponse("POST /api/v1/resources", error);
  }
}
