import { NextResponse } from "next/server";

import {
  requireUser,
  UnauthorizedError,
  type SafeUser,
} from "../../../../server/auth/require-user";
import {
  errorResponse,
  internalErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "../../../../server/http/errors";
import { updateUserSettingsSchema } from "../../../../server/settings/settings.schema";
import {
  getUserSettings,
  updateUserSettings,
} from "../../../../server/settings/settings.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const data = await getUserSettings(user.id);

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    return internalErrorResponse("GET /api/v1/settings", error);
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  let user: SafeUser;

  try {
    user = await requireUser();
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

  const parsed = updateUserSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const data = await updateUserSettings(user.id, parsed.data);

    return NextResponse.json({ data });
  } catch (error) {
    return internalErrorResponse("PATCH /api/v1/settings", error);
  }
}
