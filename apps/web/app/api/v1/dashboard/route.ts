import { NextResponse } from "next/server";

import { getDashboard } from "../../../../server/dashboard/dashboard.service";
import {
  ForbiddenError,
  requirePermission,
} from "../../../../server/auth/require-permission";
import { UnauthorizedError } from "../../../../server/auth/require-user";
import {
  forbiddenResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from "../../../../server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    await requirePermission("dashboard:read");
    const data = await getDashboard();

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof ForbiddenError) {
      return forbiddenResponse();
    }

    return internalErrorResponse("GET /api/v1/dashboard", error);
  }
}
