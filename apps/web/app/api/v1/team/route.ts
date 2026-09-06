import { NextResponse } from "next/server";

import { requireUser, UnauthorizedError } from "../../../../server/auth/require-user";
import {
  internalErrorResponse,
  unauthorizedResponse,
} from "../../../../server/http/errors";
import { listTeamMembers } from "../../../../server/team/team.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    await requireUser();
    const data = await listTeamMembers();

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }

    return internalErrorResponse("GET /api/v1/team", error);
  }
}
