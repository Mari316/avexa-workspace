import { NextResponse } from "next/server";

import { listAuditEventsQuerySchema } from "../../../../server/audit/audit.dto";
import { listAuditEvents } from "../../../../server/audit/audit.service";
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
} from "../../../../server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requirePermission("audit:read");

    const url = new URL(request.url);
    const rawLimit = url.searchParams.get("limit");
    const parsed = listAuditEventsQuerySchema.safeParse({
      q: url.searchParams.get("q") ?? undefined,
      action: url.searchParams.get("action") ?? undefined,
      entityType: url.searchParams.get("entityType") ?? undefined,
      limit:
        rawLimit == null || rawLimit.trim() === ""
          ? undefined
          : Number(rawLimit),
    });

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        path: issue.path.map(String).join(".") || "(query)",
        message: issue.message,
      }));

      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "Query parameters are invalid.",
        details,
      );
    }

    const data = await listAuditEvents(parsed.data);

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    if (error instanceof ForbiddenError) {
      return forbiddenResponse();
    }

    return internalErrorResponse("GET /api/v1/audit-log", error);
  }
}
