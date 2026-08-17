import { NextResponse } from "next/server";

import { toClientDTO } from "../../../../../server/clients/client.dto";
import {
  clientSlugParamSchema,
  updateClientSchema,
} from "../../../../../server/clients/client.schema";
import {
  getClientBySlug,
  PrimaryContactClientMismatchError,
  PrimaryContactNotFoundError,
  updateClientBySlug,
} from "../../../../../server/clients/client.service";
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

function clientNotFound(): NextResponse {
  return errorResponse(404, "CLIENT_NOT_FOUND", "Client was not found.");
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { slug } = await context.params;

  // A slug that could never exist is reported as missing rather than as a validation error.
  if (!clientSlugParamSchema.safeParse(slug).success) {
    return clientNotFound();
  }

  try {
    await requireUser();
    const row = await getClientBySlug(slug);

    return row ? NextResponse.json({ data: toClientDTO(row) }) : clientNotFound();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    return internalErrorResponse(`GET /api/v1/clients/${slug}`, error);
  }
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const { slug } = await context.params;

  if (!clientSlugParamSchema.safeParse(slug).success) {
    return clientNotFound();
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

  const parsed = updateClientSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const row = await updateClientBySlug(slug, parsed.data);

    return row ? NextResponse.json({ data: toClientDTO(row) }) : clientNotFound();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof PrimaryContactNotFoundError) {
      return errorResponse(
        400,
        "CONTACT_NOT_FOUND",
        "The selected primary contact does not exist.",
      );
    }

    if (error instanceof PrimaryContactClientMismatchError) {
      return errorResponse(
        409,
        "PRIMARY_CONTACT_CLIENT_MISMATCH",
        "That contact belongs to a different client.",
      );
    }

    return internalErrorResponse(`PATCH /api/v1/clients/${slug}`, error);
  }
}
