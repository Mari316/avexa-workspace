import { z } from "zod";

import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  type AuditAction,
  type AuditEntityType,
  type AuditEventMetadata,
  type AuditEventRow,
  type AuditEventType,
} from "../db/schema";

export type AuditEventDTO = {
  id: string;
  createdAt: string;
  actorName: string;
  action: "Created" | "Updated" | "Deleted";
  entityType: "Client" | "Contact" | "Project" | "Task" | "Note";
  entitySlug: string;
  entityLabel: string;
  details: string;
};

export type WriteAuditEventInput = {
  eventType: AuditEventType;
  entityType: AuditEntityType;
  action: AuditAction;
  entityId: string | null;
  entitySlug: string;
  entityLabel: string;
  actorUserId: string;
  actorName: string;
  metadata?: AuditEventMetadata;
};

export type ListAuditEventsInput = {
  q?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  limit?: number;
};

const optionalBlank = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

export const listAuditEventsQuerySchema = z.object({
  q: optionalBlank,
  action: optionalBlank.pipe(z.enum(AUDIT_ACTIONS).optional()),
  entityType: optionalBlank.pipe(z.enum(AUDIT_ENTITY_TYPES).optional()),
  limit: z.number().int().min(1).max(200).optional(),
});

const ACTION_LABEL: Record<AuditAction, AuditEventDTO["action"]> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
};

const ENTITY_TYPE_LABEL: Record<AuditEntityType, AuditEventDTO["entityType"]> = {
  client: "Client",
  contact: "Contact",
  project: "Project",
  task: "Task",
  note: "Note",
};

function changedFieldsFrom(metadata: AuditEventMetadata): string[] {
  if (!Array.isArray(metadata.changedFields)) {
    return [];
  }

  return metadata.changedFields.filter((field): field is string => typeof field === "string");
}

function toDetails(row: AuditEventRow): string {
  const actionLabel = ACTION_LABEL[row.action as AuditAction] ?? row.action;
  const base = `${actionLabel} ${row.entityType} "${row.entityLabel}"`;
  const fields = changedFieldsFrom(row.metadata ?? {});

  if (row.action === "updated" && fields.length > 0) {
    return `${base} (${fields.join(", ")})`;
  }

  return base;
}

export function toAuditEventDTO(row: AuditEventRow): AuditEventDTO {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    actorName: row.actorName,
    action: ACTION_LABEL[row.action as AuditAction] ?? "Updated",
    entityType: ENTITY_TYPE_LABEL[row.entityType as AuditEntityType] ?? "Task",
    entitySlug: row.entitySlug,
    entityLabel: row.entityLabel,
    details: toDetails(row),
  };
}

export function changedFieldsMetadata(body: object): AuditEventMetadata {
  return { changedFields: Object.keys(body) };
}
