import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CLIENT_NAME_NOT_SLUGGABLE"
  | "CLIENT_NOT_FOUND"
  | "CLIENT_SLUG_CONFLICT"
  | "CONTACT_NAME_NOT_SLUGGABLE"
  | "CONTACT_NOT_FOUND"
  | "CONTACT_SLUG_CONFLICT"
  | "CONTACT_IS_PRIMARY_CONTACT"
  | "PRIMARY_CONTACT_CLIENT_MISMATCH"
  | "PROJECT_NAME_NOT_SLUGGABLE"
  | "PROJECT_NOT_FOUND"
  | "PROJECT_SLUG_CONFLICT"
  | "TASK_TITLE_NOT_SLUGGABLE"
  | "TASK_NOT_FOUND"
  | "TASK_SLUG_CONFLICT"
  | "INTERNAL_ERROR";

type ErrorDetail = {
  path: string;
  message: string;
};

export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: ErrorDetail[],
): NextResponse {
  return NextResponse.json({ error: { code, message, ...(details && { details }) } }, { status });
}

export function validationErrorResponse(error: ZodError): NextResponse {
  const details = error.issues.map((issue) => ({
    path: issue.path.map(String).join(".") || "(body)",
    message: issue.message,
  }));

  return errorResponse(400, "VALIDATION_ERROR", "Request body is invalid.", details);
}

/** Logs the real cause server-side and returns a response that leaks nothing. */
export function internalErrorResponse(context: string, error: unknown): NextResponse {
  console.error(`[api] ${context} failed:`, error);

  return errorResponse(500, "INTERNAL_ERROR", "Something went wrong.");
}

export function unauthorizedResponse(): NextResponse {
  return errorResponse(401, "UNAUTHORIZED", "Authentication required.");
}

export function forbiddenResponse(): NextResponse {
  return errorResponse(
    403,
    "FORBIDDEN",
    "You do not have permission to perform this action.",
  );
}
