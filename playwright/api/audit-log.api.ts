import type { APIRequestContext, APIResponse } from "@playwright/test";

import { isRecord } from "./errors.js";

export type AuditAction = "Created" | "Updated" | "Deleted";
export type AuditEntityType = "Client" | "Contact" | "Project" | "Task" | "Note";

export type AuditEvent = {
  id: string;
  createdAt: string;
  actorName: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entitySlug: string;
  entityLabel: string;
  details: string;
};

export type GetAuditLogParams = {
  q?: string;
  action?: "created" | "updated" | "deleted";
  entityType?: "client" | "contact" | "project" | "task" | "note";
  limit?: number;
};

export class AuditLogApi {
  constructor(private readonly request: APIRequestContext) {}

  getAuditLog(params: GetAuditLogParams = {}): Promise<APIResponse> {
    const search = new URLSearchParams();

    if (params.q?.trim()) {
      search.set("q", params.q.trim());
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

    return this.request.get(
      suffix ? `/api/v1/audit-log?${suffix}` : "/api/v1/audit-log",
    );
  }
}

export async function readAuditLog(response: APIResponse): Promise<AuditEvent[]> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !Array.isArray(body.data)) {
    throw new Error("Audit log response is missing data");
  }

  return body.data.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Audit log item ${index} is not an object`);
    }

    return parseAuditEvent(item, index);
  });
}

function parseAuditEvent(
  data: Record<string, unknown>,
  index: number,
): AuditEvent {
  const id = data.id;
  const createdAt = data.createdAt;
  const actorName = data.actorName;
  const action = data.action;
  const entityType = data.entityType;
  const entitySlug = data.entitySlug;
  const entityLabel = data.entityLabel;
  const details = data.details;

  if (typeof id !== "string" || id.length === 0) {
    throw new Error(`Audit log item ${index} is missing id`);
  }

  if (typeof createdAt !== "string" || createdAt.length === 0) {
    throw new Error(`Audit log item ${index} is missing createdAt`);
  }

  if (typeof actorName !== "string") {
    throw new Error(`Audit log item ${index} is missing actorName`);
  }

  if (!isAuditAction(action)) {
    throw new Error(`Audit log item ${index} has an invalid action`);
  }

  if (!isAuditEntityType(entityType)) {
    throw new Error(`Audit log item ${index} has an invalid entityType`);
  }

  if (typeof entitySlug !== "string" || entitySlug.length === 0) {
    throw new Error(`Audit log item ${index} is missing entitySlug`);
  }

  if (typeof entityLabel !== "string") {
    throw new Error(`Audit log item ${index} is missing entityLabel`);
  }

  if (typeof details !== "string") {
    throw new Error(`Audit log item ${index} is missing details`);
  }

  return {
    id,
    createdAt,
    actorName,
    action,
    entityType,
    entitySlug,
    entityLabel,
    details,
  };
}

function isAuditAction(value: unknown): value is AuditAction {
  return value === "Created" || value === "Updated" || value === "Deleted";
}

function isAuditEntityType(value: unknown): value is AuditEntityType {
  return (
    value === "Client" ||
    value === "Contact" ||
    value === "Project" ||
    value === "Task" ||
    value === "Note"
  );
}
