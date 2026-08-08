import {
  clients as seedClients,
  contacts as seedContacts,
  formatContactName,
  getContactSlug,
  projects as seedProjects,
  tasks as seedTasks,
  type Client,
  type Contact,
  type Project,
  type Task,
} from "./mockData";

/** Primary persisted workspace blob (single object keeps relationships atomic). */
export const WORKSPACE_STORAGE_KEY = "avexa.workspace.v1";

/** Previous storage key — migrated automatically on load. */
export const LEGACY_STORAGE_KEY = "avexa-app-data";

export const WORKSPACE_STORAGE_VERSION = 1 as const;

export type StoredAppData = {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  contacts: Contact[];
};

type PersistedWorkspace = StoredAppData & {
  version: typeof WORKSPACE_STORAGE_VERSION;
};

type LegacyClient = Client & {
  primaryContact?: string;
  contactEmail?: string;
};

type LegacyContact = Contact & {
  slug?: string;
};

export function getSeedData(): StoredAppData {
  return {
    clients: seedClients.map((client) => ({ ...client })),
    projects: seedProjects.map((project) => ({ ...project })),
    tasks: seedTasks.map((task) => ({ ...task })),
    contacts: seedContacts.map((contact) => ({ ...contact })),
  };
}

function isStoredAppData(value: unknown): value is StoredAppData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as StoredAppData;

  return (
    Array.isArray(candidate.clients) &&
    Array.isArray(candidate.projects) &&
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.contacts)
  );
}

function parsePersistedWorkspace(raw: string): StoredAppData | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as PersistedWorkspace | StoredAppData;

    if ("version" in record && record.version === WORKSPACE_STORAGE_VERSION) {
      return isStoredAppData(record) ? record : null;
    }

    return isStoredAppData(record) ? record : null;
  } catch {
    return null;
  }
}

function readRawWorkspaceData(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const current = localStorage.getItem(WORKSPACE_STORAGE_KEY);

  if (current) {
    return current;
  }

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);

  if (legacy) {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, legacy);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return legacy;
  }

  return null;
}

function migrateContacts(
  storedContacts: LegacyContact[],
  seed: StoredAppData,
): Contact[] {
  return storedContacts.map((contact) => {
    if (contact.slug) {
      return contact;
    }

    const seedContact = seed.contacts.find(
      (seedItem) => seedItem.id === contact.id,
    );

    if (seedContact) {
      return { ...contact, slug: seedContact.slug };
    }

    return {
      ...contact,
      slug: getContactSlug(contact.firstName, contact.lastName),
    };
  });
}

function findSeedClientForStoredClient(
  client: LegacyClient,
  contacts: Contact[],
  projects: Project[],
  seed: StoredAppData,
): Client | undefined {
  const seedSlugs = new Set(seed.clients.map((seedClient) => seedClient.slug));

  if (seedSlugs.has(client.slug)) {
    return seed.clients.find((seedClient) => seedClient.slug === client.slug);
  }

  if (client.primaryContactSlug) {
    const match = seed.clients.find(
      (seedClient) =>
        seedClient.primaryContactSlug === client.primaryContactSlug,
    );

    if (match) {
      return match;
    }
  }

  const storedProjectSlugs = new Set(
    projects
      .filter((project) => project.client === client.name)
      .map((project) => project.slug),
  );

  for (const seedClient of seed.clients) {
    const seedProjectSlugs = seed.projects
      .filter((project) => project.client === seedClient.name)
      .map((project) => project.slug);

    if (
      seedProjectSlugs.some((projectSlug) => storedProjectSlugs.has(projectSlug))
    ) {
      return seedClient;
    }
  }

  for (const seedClient of seed.clients) {
    const seedContactEmails = new Set(
      seed.contacts
        .filter((contact) => contact.client === seedClient.name)
        .map((contact) => contact.email),
    );

    const hasSharedContact = contacts.some(
      (contact) =>
        contact.client === client.name &&
        seedContactEmails.has(contact.email),
    );

    if (hasSharedContact) {
      return seedClient;
    }
  }

  if (client.primaryContact || client.contactEmail) {
    for (const seedClient of seed.clients) {
      const seedPrimaryContact = seed.contacts.find(
        (contact) => contact.slug === seedClient.primaryContactSlug,
      );

      if (!seedPrimaryContact) {
        continue;
      }

      const nameMatches =
        client.primaryContact &&
        formatContactName(
          seedPrimaryContact.firstName,
          seedPrimaryContact.lastName,
        ) === client.primaryContact;

      const emailMatches =
        client.contactEmail &&
        seedPrimaryContact.email === client.contactEmail;

      if (nameMatches || emailMatches) {
        return seedClient;
      }
    }
  }

  return undefined;
}

function normalizeClientSlug(client: LegacyClient, seedClient?: Client): string {
  if (seedClient) {
    return seedClient.slug;
  }

  return client.slug.toLowerCase().replace(/\s+/g, "-");
}

function deduplicateClientsBySlug(
  clients: Client[],
  seed: StoredAppData,
): Client[] {
  const seedBySlug = new Map(
    seed.clients.map((seedClient) => [seedClient.slug, seedClient]),
  );
  const bySlug = new Map<string, Client>();

  for (const client of clients) {
    const existing = bySlug.get(client.slug);

    if (!existing) {
      bySlug.set(client.slug, client);
      continue;
    }

    const seedClient = seedBySlug.get(client.slug);
    const existingUsesSeedName =
      seedClient !== undefined && existing.name === seedClient.name;
    const clientUsesSeedName =
      seedClient !== undefined && client.name === seedClient.name;

    if (existingUsesSeedName && !clientUsesSeedName) {
      bySlug.set(client.slug, client);
    }
  }

  return Array.from(bySlug.values());
}

function migrateClients(
  storedClients: LegacyClient[],
  contacts: Contact[],
  projects: Project[],
  seed: StoredAppData,
): Client[] {
  return storedClients.map((client) => {
    const seedClient = findSeedClientForStoredClient(
      client,
      contacts,
      projects,
      seed,
    );
    const stableSlug = normalizeClientSlug(client, seedClient);

    let primaryContactSlug = client.primaryContactSlug ?? "";

    if (!primaryContactSlug && client.primaryContact) {
      const matchedContact = contacts.find(
        (contact) =>
          formatContactName(contact.firstName, contact.lastName) ===
            client.primaryContact ||
          (client.contactEmail && contact.email === client.contactEmail),
      );

      primaryContactSlug =
        matchedContact?.slug ?? seedClient?.primaryContactSlug ?? "";
    }

    if (!primaryContactSlug && seedClient) {
      primaryContactSlug = seedClient.primaryContactSlug;
    }

    return {
      name: client.name,
      slug: stableSlug,
      projectCount: client.projectCount,
      primaryContactSlug,
      status: client.status,
    };
  });
}

export function migrateAppData(
  parsed: StoredAppData,
  seed: StoredAppData = getSeedData(),
): StoredAppData {
  const contacts = migrateContacts(parsed.contacts, seed);
  const clients = deduplicateClientsBySlug(
    migrateClients(parsed.clients, contacts, parsed.projects, seed),
    seed,
  );

  return {
    clients,
    projects: parsed.projects,
    tasks: parsed.tasks,
    contacts,
  };
}

function serializeWorkspace(data: StoredAppData): string {
  const payload: PersistedWorkspace = {
    version: WORKSPACE_STORAGE_VERSION,
    ...migrateAppData(data),
  };

  return JSON.stringify(payload);
}

export function saveAppData(data: StoredAppData): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(WORKSPACE_STORAGE_KEY, serializeWorkspace(data));
}

export function loadAppData(seed: StoredAppData = getSeedData()): StoredAppData {
  if (typeof window === "undefined") {
    return seed;
  }

  const raw = readRawWorkspaceData();

  if (!raw) {
    saveAppData(seed);
    return seed;
  }

  const parsed = parsePersistedWorkspace(raw);

  if (!parsed) {
    saveAppData(seed);
    return seed;
  }

  const migrated = migrateAppData(parsed, seed);
  localStorage.setItem(WORKSPACE_STORAGE_KEY, serializeWorkspace(migrated));
  return migrated;
}

export function clearAppDataStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

/** @deprecated Use WORKSPACE_STORAGE_KEY */
export const APP_DATA_STORAGE_KEY = WORKSPACE_STORAGE_KEY;
