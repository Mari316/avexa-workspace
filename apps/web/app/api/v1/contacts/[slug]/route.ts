import { NextResponse } from "next/server";

import { toContactDTO } from "../../../../../server/contacts/contact.dto";
import {
  contactSlugParamSchema,
  updateContactSchema,
} from "../../../../../server/contacts/contact.schema";
import {
  ClientNotFoundError,
  ContactIsPrimaryContactError,
  getContactBySlug,
  updateContactBySlug,
} from "../../../../../server/contacts/contact.service";
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

function contactNotFound(): NextResponse {
  return errorResponse(404, "CONTACT_NOT_FOUND", "Contact was not found.");
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;

  // A slug that could never exist is reported as missing rather than as a validation error.
  if (!contactSlugParamSchema.safeParse(slug).success) {
    return contactNotFound();
  }

  try {
    await requirePermission("contacts:read");
    const row = await getContactBySlug(slug);

    return row ? NextResponse.json({ data: toContactDTO(row) }) : contactNotFound();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof ForbiddenError) {
      return forbiddenResponse();
    }

    return internalErrorResponse(`GET /api/v1/contacts/${slug}`, error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;

  if (!contactSlugParamSchema.safeParse(slug).success) {
    return contactNotFound();
  }

  try {
    await requirePermission("contacts:update");
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

  const parsed = updateContactSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const row = await updateContactBySlug(slug, parsed.data);

    return row ? NextResponse.json({ data: toContactDTO(row) }) : contactNotFound();
  } catch (error) {
    if (error instanceof ClientNotFoundError) {
      return errorResponse(400, "CLIENT_NOT_FOUND", "The selected client does not exist.");
    }

    if (error instanceof ContactIsPrimaryContactError) {
      return errorResponse(
        409,
        "CONTACT_IS_PRIMARY_CONTACT",
        "This contact is the primary contact for its current client. Choose a different primary contact first.",
      );
    }

    return internalErrorResponse(`PATCH /api/v1/contacts/${slug}`, error);
  }
}
