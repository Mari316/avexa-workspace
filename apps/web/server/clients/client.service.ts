import { asc, eq } from "drizzle-orm";

import { db } from "../db";
import { isUniqueViolation, violatedConstraint } from "../db/constraint-errors";
import { clients, contacts, type ClientRow } from "../db/schema";
import type { CreateClientInput, UpdateClientInput } from "./client.schema";
import { slugifyClientName } from "./slug";

/** Thrown when a non-empty client name contains nothing a slug can be built from. */
export class ClientNameNotSluggableError extends Error {
  constructor(name: string) {
    super(`Client name "${name}" cannot be converted into a URL slug.`);
    this.name = "ClientNameNotSluggableError";
  }
}

/** Thrown when the generated slug is already taken. Slugs are never auto-suffixed. */
export class ClientSlugConflictError extends Error {
  constructor(readonly slug: string) {
    super(`A client with the slug "${slug}" already exists.`);
    this.name = "ClientSlugConflictError";
  }
}

/** Thrown when the requested primary contact does not exist at all. */
export class PrimaryContactNotFoundError extends Error {
  constructor(readonly contactId: string) {
    super(`Contact "${contactId}" does not exist.`);
    this.name = "PrimaryContactNotFoundError";
  }
}

/** Thrown when the requested primary contact belongs to a different client. */
export class PrimaryContactClientMismatchError extends Error {
  constructor(readonly contactId: string) {
    super(`Contact "${contactId}" belongs to a different client.`);
    this.name = "PrimaryContactClientMismatchError";
  }
}

const PRIMARY_CONTACT_FK = "clients_primary_contact_belongs_to_client";

export async function listClients(): Promise<ClientRow[]> {
  return db.select().from(clients).orderBy(asc(clients.createdAt), asc(clients.slug));
}

export async function getClientBySlug(slug: string): Promise<ClientRow | null> {
  const [row] = await db.select().from(clients).where(eq(clients.slug, slug)).limit(1);

  return row ?? null;
}

export async function createClient(input: CreateClientInput): Promise<ClientRow> {
  const slug = slugifyClientName(input.name);

  if (!slug) {
    throw new ClientNameNotSluggableError(input.name);
  }

  try {
    const [row] = await db
      .insert(clients)
      .values({ slug, name: input.name, status: input.status })
      .returning();

    if (!row) {
      throw new Error("Client insert returned no row.");
    }

    return row;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ClientSlugConflictError(slug);
    }

    throw error;
  }
}

/**
 * The composite foreign key already makes a cross-client primary contact impossible to
 * store, but it can only report "constraint violated". Checking first lets the caller
 * learn whether the contact is missing or simply belongs to somebody else.
 */
async function assertContactBelongsToClient(
  contactId: string,
  clientId: string,
): Promise<void> {
  const [contact] = await db
    .select({ clientId: contacts.clientId })
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);

  if (!contact) {
    throw new PrimaryContactNotFoundError(contactId);
  }

  if (contact.clientId !== clientId) {
    throw new PrimaryContactClientMismatchError(contactId);
  }
}

export async function updateClientBySlug(
  slug: string,
  input: UpdateClientInput,
): Promise<ClientRow | null> {
  if (typeof input.primaryContactId === "string") {
    const existing = await getClientBySlug(slug);

    if (!existing) {
      return null;
    }

    await assertContactBelongsToClient(input.primaryContactId, existing.id);
  }

  // Only the mutable columns are ever written; id, slug and createdAt are untouchable.
  const changes: Partial<
    Pick<ClientRow, "name" | "status" | "primaryContactId" | "updatedAt">
  > = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    changes.name = input.name;
  }

  if (input.status !== undefined) {
    changes.status = input.status;
  }

  if (input.primaryContactId !== undefined) {
    changes.primaryContactId = input.primaryContactId;
  }

  try {
    const [row] = await db
      .update(clients)
      .set(changes)
      .where(eq(clients.slug, slug))
      .returning();

    return row ?? null;
  } catch (error) {
    // Backstop for the race where the contact is reassigned between check and update.
    if (violatedConstraint(error) === PRIMARY_CONTACT_FK) {
      throw new PrimaryContactClientMismatchError(String(input.primaryContactId));
    }

    throw error;
  }
}
