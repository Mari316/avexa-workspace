import { clients as seedClients } from "./mockData";

/**
 * Temporary browser-side store for the client → primary contact relationship.
 *
 * Clients live in PostgreSQL but contacts do not yet, so this relationship cannot be a
 * foreign key. Only the relationship is stored here — never a copy of client name or
 * status — so the database stays the single source of truth for client data. This whole
 * module is deleted once contacts move to the database and the relationship becomes
 * `clients.primary_contact_id`.
 *
 * Keyed by client slug, which is stable across renames.
 */
export const CLIENT_PRIMARY_CONTACTS_KEY = "avexa.clientPrimaryContacts.v1";

export type ClientPrimaryContacts = Record<string, string>;

function buildSeedMap(): ClientPrimaryContacts {
  const map: ClientPrimaryContacts = {};

  for (const client of seedClients) {
    if (client.primaryContactSlug) {
      map[client.slug] = client.primaryContactSlug;
    }
  }

  return map;
}

function parseStoredMap(raw: string): ClientPrimaryContacts | null {
  const parsed: unknown = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const map: ClientPrimaryContacts = {};

  for (const [clientSlug, contactSlug] of Object.entries(parsed)) {
    if (typeof contactSlug === "string" && contactSlug) {
      map[clientSlug] = contactSlug;
    }
  }

  return map;
}

export function saveClientPrimaryContacts(map: ClientPrimaryContacts): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CLIENT_PRIMARY_CONTACTS_KEY,
      JSON.stringify(map),
    );
  } catch {
    // A full or unavailable localStorage must not break client editing.
  }
}

export function loadClientPrimaryContacts(): ClientPrimaryContacts {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(CLIENT_PRIMARY_CONTACTS_KEY);

    if (!raw) {
      const seeded = buildSeedMap();
      saveClientPrimaryContacts(seeded);

      return seeded;
    }

    return parseStoredMap(raw) ?? buildSeedMap();
  } catch {
    return buildSeedMap();
  }
}

/** Restores the demo relationships. Used by Settings → Reset Demo Data. */
export function resetClientPrimaryContacts(): ClientPrimaryContacts {
  const seeded = buildSeedMap();
  saveClientPrimaryContacts(seeded);

  return seeded;
}
