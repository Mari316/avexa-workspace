import { asc, eq } from "drizzle-orm";

import { db } from "../db";
import { clients, type ClientRow } from "../db/schema";
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

const UNIQUE_VIOLATION = "23505";

/**
 * Drizzle wraps driver errors, so the pg error code is reached through the cause chain.
 * The unique index is the only authority on slug uniqueness: a pre-flight SELECT would
 * still lose a race against a concurrent insert.
 */
function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;

  while (current) {
    if (
      typeof current === "object" &&
      "code" in current &&
      (current as { code?: unknown }).code === UNIQUE_VIOLATION
    ) {
      return true;
    }

    current = (current as { cause?: unknown }).cause;
  }

  return false;
}

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

export async function updateClientBySlug(
  slug: string,
  input: UpdateClientInput,
): Promise<ClientRow | null> {
  // Only the mutable columns are ever written; id, slug and createdAt are untouchable.
  const changes: Partial<Pick<ClientRow, "name" | "status" | "updatedAt">> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    changes.name = input.name;
  }

  if (input.status !== undefined) {
    changes.status = input.status;
  }

  const [row] = await db
    .update(clients)
    .set(changes)
    .where(eq(clients.slug, slug))
    .returning();

  return row ?? null;
}
