import { NextResponse } from "next/server";

import { toClientDTO } from "../../../../server/clients/client.dto";
import { createClientSchema } from "../../../../server/clients/client.schema";
import {
  ClientNameNotSluggableError,
  ClientSlugConflictError,
  createClient,
  listClients,
} from "../../../../server/clients/client.service";
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
    await requirePermission("clients:read");
    const rows = await listClients();

    return NextResponse.json({ data: rows.map(toClientDTO) });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof ForbiddenError) {
      return forbiddenResponse();
    }

    return internalErrorResponse("GET /api/v1/clients", error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requirePermission("clients:create");
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

  const parsed = createClientSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const row = await createClient(parsed.data);

    return NextResponse.json(
      { data: toClientDTO(row) },
      { status: 201, headers: { Location: `/api/v1/clients/${row.slug}` } },
    );
  } catch (error) {
    if (error instanceof ClientNameNotSluggableError) {
      return errorResponse(400, "CLIENT_NAME_NOT_SLUGGABLE", error.message);
    }

    if (error instanceof ClientSlugConflictError) {
      return errorResponse(409, "CLIENT_SLUG_CONFLICT", error.message);
    }

    return internalErrorResponse("POST /api/v1/clients", error);
  }
}
