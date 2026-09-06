import type { APIResponse } from "@playwright/test";

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: { path: string; message: string }[];
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function readApiError(
  response: APIResponse,
): Promise<ApiErrorBody> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !isRecord(body.error)) {
    throw new Error("API error response is missing error");
  }

  const code = body.error.code;
  const message = body.error.message;

  if (typeof code !== "string" || typeof message !== "string") {
    throw new Error("API error response is missing error.code or error.message");
  }

  const details = parseErrorDetails(body.error.details);

  return details ? { code, message, details } : { code, message };
}

function parseErrorDetails(
  value: unknown,
): { path: string; message: string }[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const details: { path: string; message: string }[] = [];

  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.path !== "string" ||
      typeof item.message !== "string"
    ) {
      throw new Error("API error response has an invalid details entry");
    }

    details.push({ path: item.path, message: item.message });
  }

  return details;
}
