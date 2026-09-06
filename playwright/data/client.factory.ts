export type ClientStatus = "Active" | "On Hold";

export type CreateClientRequest = {
  name: string;
  status: ClientStatus;
};

export type UpdateClientRequest = {
  name?: string;
  status?: ClientStatus;
};

export function buildClient(
  overrides: Partial<CreateClientRequest> = {},
): CreateClientRequest {
  return {
    name: overrides.name ?? `PW client ${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    status: overrides.status ?? "Active",
  };
}
