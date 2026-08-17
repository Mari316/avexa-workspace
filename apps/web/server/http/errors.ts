import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "CLIENT_NAME_NOT_SLUGGABLE"
  | "CLIENT_NOT_FOUND"
  | "CLIENT_SLUG_CONFLICT"
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
