import { asc, eq } from "drizzle-orm";

import { db } from "../db";
import {
  isForeignKeyViolation,
  isUniqueViolation,
  violatedConstraint,
} from "../db/constraint-errors";
import { clients, contacts } from "../db/schema";
import { slugify } from "../slug";
import type { ContactWithClientRow } from "./contact.dto";
import type { CreateContactInput, UpdateContactInput } from "./contact.schema";

/** Thrown when a non-empty contact name contains nothing a slug can be built from. */
export class ContactNameNotSluggableError extends Error {
  constructor(name: string) {
    super(`Contact name "${name}" cannot be converted into a URL slug.`);
    this.name = "ContactNameNotSluggableError";
  }
}

/** Thrown when the generated slug is already taken. Slugs are never auto-suffixed. */
export class ContactSlugConflictError extends Error {
  constructor(readonly slug: string) {
    super(`A contact with the slug "${slug}" already exists.`);
    this.name = "ContactSlugConflictError";
  }
}

/** Thrown when the referenced client does not exist. */
export class ClientNotFoundError extends Error {
  constructor(readonly clientId: string) {
    super(`Client "${clientId}" does not exist.`);
    this.name = "ClientNotFoundError";
  }
}

/** Thrown when moving a contact would strand a client's primary-contact reference. */
export class ContactIsPrimaryContactError extends Error {
  constructor(readonly slug: string) {
    super(
      `Contact "${slug}" is the primary contact for its current client and cannot be reassigned.`,
    );
    this.name = "ContactIsPrimaryContactError";
  }
}

const CLIENT_FK = "contacts_client_id_clients_id_fk";
const PRIMARY_CONTACT_FK = "clients_primary_contact_belongs_to_client";

const contactSelection = {
  id: contacts.id,
  slug: contacts.slug,
  firstName: contacts.firstName,
  lastName: contacts.lastName,
  clientId: contacts.clientId,
  email: contacts.email,
  role: contacts.role,
  status: contacts.status,
  createdAt: contacts.createdAt,
  updatedAt: contacts.updatedAt,
  clientSlug: clients.slug,
  clientName: clients.name,
};

export async function listContacts(): Promise<ContactWithClientRow[]> {
  return db
    .select(contactSelection)
    .from(contacts)
    .innerJoin(clients, eq(contacts.clientId, clients.id))
    .orderBy(asc(contacts.createdAt), asc(contacts.slug));
}

export async function getContactBySlug(
  slug: string,
): Promise<ContactWithClientRow | null> {
  const [row] = await db
    .select(contactSelection)
    .from(contacts)
    .innerJoin(clients, eq(contacts.clientId, clients.id))
    .where(eq(contacts.slug, slug))
    .limit(1);

  return row ?? null;
}

export async function createContact(
  input: CreateContactInput,
): Promise<ContactWithClientRow> {
  const slug = slugify(`${input.firstName} ${input.lastName}`);

  if (!slug) {
    throw new ContactNameNotSluggableError(`${input.firstName} ${input.lastName}`);
  }

  try {
    const [row] = await db
      .insert(contacts)
      .values({
        slug,
        firstName: input.firstName,
        lastName: input.lastName,
        clientId: input.clientId,
        email: input.email,
        role: input.role,
        status: input.status,
      })
      .returning({ slug: contacts.slug });

    if (!row) {
      throw new Error("Contact insert returned no row.");
    }

    const created = await getContactBySlug(row.slug);

    if (!created) {
      throw new Error("Contact disappeared immediately after insert.");
    }

    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ContactSlugConflictError(slug);
    }

    if (isForeignKeyViolation(error)) {
      throw new ClientNotFoundError(input.clientId);
    }

    throw error;
  }
}

export async function updateContactBySlug(
  slug: string,
  input: UpdateContactInput,
): Promise<ContactWithClientRow | null> {
  // Only mutable columns are ever written; id, slug and createdAt are untouchable.
  const changes = {
    updatedAt: new Date(),
    ...(input.firstName !== undefined && { firstName: input.firstName }),
    ...(input.lastName !== undefined && { lastName: input.lastName }),
    ...(input.clientId !== undefined && { clientId: input.clientId }),
    ...(input.email !== undefined && { email: input.email }),
    ...(input.role !== undefined && { role: input.role }),
    ...(input.status !== undefined && { status: input.status }),
  };

  try {
    const [row] = await db
      .update(contacts)
      .set(changes)
      .where(eq(contacts.slug, slug))
      .returning({ slug: contacts.slug });

    return row ? await getContactBySlug(row.slug) : null;
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      const constraint = violatedConstraint(error);

      // Moving the contact to a client that a stale dropdown still offers.
      if (constraint === CLIENT_FK && input.clientId) {
        throw new ClientNotFoundError(input.clientId);
      }

      // Moving the contact away from the client that names it as primary contact.
      if (constraint === PRIMARY_CONTACT_FK) {
        throw new ContactIsPrimaryContactError(slug);
      }
    }

    throw error;
  }
}
