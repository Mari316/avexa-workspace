import { NextResponse } from "next/server";

import { toContactDTO } from "../../../../server/contacts/contact.dto";
import { createContactSchema } from "../../../../server/contacts/contact.schema";
import {
  ClientNotFoundError,
  ContactNameNotSluggableError,
  ContactSlugConflictError,
  createContact,
  listContacts,
} from "../../../../server/contacts/contact.service";
import {
  errorResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "../../../../server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await listContacts();

    return NextResponse.json({ data: rows.map(toContactDTO) });
  } catch (error) {
    return internalErrorResponse("GET /api/v1/contacts", error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Request body must be valid JSON.");
  }

  const parsed = createContactSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const row = await createContact(parsed.data);

    return NextResponse.json(
      { data: toContactDTO(row) },
      { status: 201, headers: { Location: `/api/v1/contacts/${row.slug}` } },
    );
  } catch (error) {
    if (error instanceof ContactNameNotSluggableError) {
      return errorResponse(
        400,
        "CONTACT_NAME_NOT_SLUGGABLE",
        "Contact name must contain letters or numbers.",
      );
    }

    if (error instanceof ClientNotFoundError) {
      return errorResponse(400, "CLIENT_NOT_FOUND", "The selected client does not exist.");
    }

    if (error instanceof ContactSlugConflictError) {
      return errorResponse(
        409,
        "CONTACT_SLUG_CONFLICT",
        "A contact with this name already exists.",
      );
    }

    return internalErrorResponse("POST /api/v1/contacts", error);
  }
}
