export type ApiErrorDetail = {
  path: string;
  message: string;
};

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[];
  };
};

/**
 * Shared by the resource modules in this folder: every call needs the same JSON
 * handling, `{ data }` unwrapping and `{ error }` translation. Deliberately not a
 * general API client — no interceptors, retries or caching.
 */
export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Unable to reach the server.", 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const { error } = (payload ?? {}) as ErrorPayload;

    throw new ApiError(
      error?.code ?? "INTERNAL_ERROR",
      error?.message ?? "Something went wrong.",
      response.status,
      error?.details,
    );
  }

  return (payload as { data: T }).data;
}
