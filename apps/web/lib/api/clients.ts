import type { ClientDTO } from "../../server/clients/client.dto";

export type { ClientDTO };

export type CreateClientBody = {
  name: string;
  status?: ClientDTO["status"];
};

export type UpdateClientBody = {
  name?: string;
  status?: ClientDTO["status"];
};

export type ApiErrorDetail = {
  path: string;
  message: string;
};

export class ClientApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

const CLIENTS_URL = "/api/v1/clients";

type ErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[];
  };
};

/**
 * Private to this module: every call needs the same JSON handling, `{ data }`
 * unwrapping and `{ error }` translation. This is not a general API client.
 */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new ClientApiError("NETWORK_ERROR", "Unable to reach the server.", 0);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const { error } = (payload ?? {}) as ErrorPayload;

    throw new ClientApiError(
      error?.code ?? "INTERNAL_ERROR",
      error?.message ?? "Something went wrong.",
      response.status,
      error?.details,
    );
  }

  return (payload as { data: T }).data;
}

export function listClients(): Promise<ClientDTO[]> {
  return request<ClientDTO[]>(CLIENTS_URL);
}

export async function getClient(slug: string): Promise<ClientDTO | null> {
  try {
    return await request<ClientDTO>(
      `${CLIENTS_URL}/${encodeURIComponent(slug)}`,
    );
  } catch (error) {
    if (error instanceof ClientApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export function createClient(body: CreateClientBody): Promise<ClientDTO> {
  return request<ClientDTO>(CLIENTS_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateClient(
  slug: string,
  body: UpdateClientBody,
): Promise<ClientDTO> {
  return request<ClientDTO>(`${CLIENTS_URL}/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
