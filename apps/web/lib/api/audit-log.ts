import type { AuditEventDTO } from "../../server/audit/audit.dto";
import { request } from "./request";

export type { AuditEventDTO };

export type GetAuditLogParams = {
  q?: string;
  action?: "created" | "updated" | "deleted";
  entityType?: "client" | "contact" | "project" | "task" | "note";
  limit?: number;
};

const AUDIT_LOG_URL = "/api/v1/audit-log";

export function getAuditLog(
  params: GetAuditLogParams = {},
): Promise<AuditEventDTO[]> {
  const search = new URLSearchParams();
  const query = params.q?.trim();

  if (query) {
    search.set("q", query);
  }

  if (params.action) {
    search.set("action", params.action);
  }

  if (params.entityType) {
    search.set("entityType", params.entityType);
  }

  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }

  const suffix = search.toString();

  return request<AuditEventDTO[]>(
    suffix ? `${AUDIT_LOG_URL}?${suffix}` : AUDIT_LOG_URL,
  );
}
