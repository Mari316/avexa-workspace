import type { ClientDTO } from "../../server/clients/client.dto";
import { request } from "./request";

export type { ClientDTO };

export type CreateClientBody = {
  name: string;
  status?: ClientDTO["status"];
};

export type UpdateClientBody = {
  name?: string;
  status?: ClientDTO["status"];
  primaryContactId?: string | null;
};

const CLIENTS_URL = "/api/v1/clients";

export function listClients(): Promise<ClientDTO[]> {
  return request<ClientDTO[]>(CLIENTS_URL);
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
