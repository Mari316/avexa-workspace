import { and, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "../db";
import { auditEvents } from "../db/schema";
import {
  toAuditEventDTO,
  type AuditEventDTO,
  type ListAuditEventsInput,
  type WriteAuditEventInput,
} from "./audit.dto";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

export async function writeAuditEvent(input: WriteAuditEventInput): Promise<void> {
  await db.insert(auditEvents).values({
    eventType: input.eventType,
    entityType: input.entityType,
    action: input.action,
    entityId: input.entityId,
    entitySlug: input.entitySlug,
    entityLabel: input.entityLabel,
    actorUserId: input.actorUserId,
    actorName: input.actorName,
    metadata: input.metadata ?? {},
  });
}

/**
 * Best-effort write: logs and swallows insert failures so a domain success
 * is never turned into an HTTP error.
 */
export async function recordAuditEvent(input: WriteAuditEventInput): Promise<void> {
  try {
    await writeAuditEvent(input);
  } catch (error) {
    console.error(
      `[audit] failed to write ${input.eventType} for ${input.entityType}:${input.entitySlug}:`,
      error,
    );
  }
}

export async function listAuditEvents(
  input: ListAuditEventsInput = {},
): Promise<AuditEventDTO[]> {
  const limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const filters = [];

  if (input.action) {
    filters.push(eq(auditEvents.action, input.action));
  }

  if (input.entityType) {
    filters.push(eq(auditEvents.entityType, input.entityType));
  }

  const query = input.q?.trim();
  if (query) {
    const pattern = `%${query}%`;
    filters.push(
      or(
        ilike(auditEvents.actorName, pattern),
        ilike(auditEvents.entityLabel, pattern),
        ilike(auditEvents.entitySlug, pattern),
      ),
    );
  }

  const rows = await db
    .select()
    .from(auditEvents)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(auditEvents.createdAt), desc(auditEvents.id))
    .limit(limit);

  return rows.map(toAuditEventDTO);
}
