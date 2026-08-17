import {
  projects as seedProjects,
  tasks as seedTasks,
  type Project,
  type Task,
} from "./mockData";

/**
 * Workspace blob for the domains that still live in the browser. Clients and contacts
 * were removed in v2 once both moved to PostgreSQL; projects and tasks follow later.
 */
export const WORKSPACE_STORAGE_KEY = "avexa.workspace.v2";

/** Superseded keys, cleared on load so stale client/contact copies cannot resurface. */
const RETIRED_STORAGE_KEYS = [
  "avexa.workspace.v1",
  "avexa-app-data",
  "avexa.clientPrimaryContacts.v1",
];

export const WORKSPACE_STORAGE_VERSION = 2 as const;

export type StoredAppData = {
  projects: Project[];
  tasks: Task[];
};

type PersistedWorkspace = StoredAppData & {
  version: typeof WORKSPACE_STORAGE_VERSION;
};

export function getSeedData(): StoredAppData {
  return {
    projects: seedProjects.map((project) => ({ ...project })),
    tasks: seedTasks.map((task) => ({ ...task })),
  };
}

function isStoredAppData(value: unknown): value is StoredAppData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as StoredAppData;

  return Array.isArray(candidate.projects) && Array.isArray(candidate.tasks);
}

/**
 * v1 payloads also carried clients and contacts. Those keys are simply dropped: both
 * domains are now owned by the database, so a browser copy would only go stale.
 */
function parsePersistedWorkspace(raw: string): StoredAppData | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isStoredAppData(parsed)) {
      return null;
    }

    return {
      projects: parsed.projects,
      tasks: parsed.tasks,
    };
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

  // Carry forward the projects and tasks a user already changed under the old key.
  return localStorage.getItem("avexa.workspace.v1");
}

function serializeWorkspace(data: StoredAppData): string {
  const payload: PersistedWorkspace = {
    version: WORKSPACE_STORAGE_VERSION,
    projects: data.projects,
    tasks: data.tasks,
  };

  return JSON.stringify(payload);
}

export function saveAppData(data: StoredAppData): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(WORKSPACE_STORAGE_KEY, serializeWorkspace(data));
}

export function loadAppData(
  seed: StoredAppData = getSeedData(),
): StoredAppData {
  if (typeof window === "undefined") {
    return seed;
  }

  const raw = readRawWorkspaceData();
  const parsed = raw ? parsePersistedWorkspace(raw) : null;
  const data = parsed ?? seed;

  saveAppData(data);

  for (const key of RETIRED_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }

  return data;
}

export function clearAppDataStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(WORKSPACE_STORAGE_KEY);

  for (const key of RETIRED_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}
