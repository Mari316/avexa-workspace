"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  createClient as createClientRequest,
  listClients as listClientsRequest,
  updateClient as updateClientRequest,
  type ClientDTO,
  type UpdateClientBody,
} from "../lib/api/clients";
import {
  clearAppDataStorage,
  getSeedData,
  loadAppData,
  saveAppData,
  type StoredAppData,
} from "../lib/appDataStorage";
import {
  loadClientPrimaryContacts,
  resetClientPrimaryContacts,
  saveClientPrimaryContacts,
  type ClientPrimaryContacts,
} from "../lib/clientPrimaryContacts";
import type { ClientStatus, Contact, Project, Task } from "../lib/mockData";

/**
 * A client as the UI needs it: the database-backed fields from the API plus the
 * primary contact, which is still a browser-only relationship until contacts move
 * to the database.
 */
export type ClientView = ClientDTO & {
  primaryContactSlug: string;
};

export type ClientCreateInput = {
  name: string;
  status: ClientStatus;
};

export type ClientUpdateInput = {
  name: string;
  status: ClientStatus;
  primaryContactSlug: string;
};

type AppDataState = {
  clients: ClientView[];
  isLoadingClients: boolean;
  clientsError: string;
  projects: Project[];
  tasks: Task[];
  contacts: Contact[];
  isHydrated: boolean;
};

type AppDataActions = {
  addClient: (input: ClientCreateInput) => Promise<ClientView>;
  updateClient: (slug: string, input: ClientUpdateInput) => Promise<ClientView>;
  addProject: (project: Project) => void;
  addTask: (task: Task) => void;
  updateTask: (slug: string, task: Task) => void;
  deleteTask: (slug: string) => void;
  addContact: (contact: Contact) => void;
  updateContact: (slug: string, contact: Contact) => void;
  resetDemoData: () => void;
  getProjectBySlug: (slug: string) => Project | undefined;
  getProjectByName: (name: string) => Project | undefined;
  getTaskBySlug: (slug: string) => Task | undefined;
  getClientBySlug: (slug: string) => ClientView | undefined;
  getContactBySlug: (slug: string) => Contact | undefined;
  getProjectsByClient: (clientName: string) => Project[];
  getContactsByClient: (clientName: string) => Contact[];
  getTasksByProject: (projectName: string) => Task[];
  getProjectNamesByClient: (clientName: string) => string[];
};

const AppDataStateContext = createContext<AppDataState | null>(null);
const AppDataActionsContext = createContext<AppDataActions | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const seedData = useMemo(() => getSeedData(), []);
  const [data, setData] = useState<StoredAppData>(seedData);
  const [isHydrated, setIsHydrated] = useState(false);
  const dataRef = useRef(data);

  // Clients come from PostgreSQL, so they start empty rather than from seed data.
  const [apiClients, setApiClients] = useState<ClientDTO[]>([]);
  const [primaryContacts, setPrimaryContacts] = useState<ClientPrimaryContacts>(
    {},
  );
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState("");

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    setData(loadAppData(seedData));
    setPrimaryContacts(loadClientPrimaryContacts());
    setIsHydrated(true);
  }, [seedData]);

  useEffect(() => {
    let cancelled = false;

    listClientsRequest()
      .then((rows) => {
        if (!cancelled) {
          setApiClients(rows);
          setClientsError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClientsError("Unable to load clients. Please refresh the page.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingClients(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const clients = useMemo<ClientView[]>(
    () =>
      apiClients.map((client) => ({
        ...client,
        primaryContactSlug: primaryContacts[client.slug] ?? "",
      })),
    [apiClients, primaryContacts],
  );

  const persist = useCallback(
    (updater: (current: StoredAppData) => StoredAppData) => {
      setData((current) => {
        const next = updater(current);
        saveAppData(next);
        return next;
      });
    },
    [],
  );

  const actions = useMemo<AppDataActions>(() => {
    /**
     * Temporary compatibility: projects, tasks and contacts still store their client
     * as a name string in localStorage, so a rename in PostgreSQL has to be mirrored
     * into them. This disappears once those domains use database foreign keys.
     */
    const cascadeClientRename = (previousName: string, nextName: string) => {
      persist((current) => ({
        ...current,
        projects: current.projects.map((project) =>
          project.client === previousName
            ? { ...project, client: nextName }
            : project,
        ),
        tasks: current.tasks.map((task) =>
          task.client === previousName ? { ...task, client: nextName } : task,
        ),
        contacts: current.contacts.map((contact) =>
          contact.client === previousName
            ? { ...contact, client: nextName }
            : contact,
        ),
      }));
    };

    const setPrimaryContactSlug = (clientSlug: string, contactSlug: string) => {
      setPrimaryContacts((current) => {
        const next = { ...current };

        if (contactSlug) {
          next[clientSlug] = contactSlug;
        } else {
          delete next[clientSlug];
        }

        saveClientPrimaryContacts(next);

        return next;
      });
    };

    const addClient = async (input: ClientCreateInput): Promise<ClientView> => {
      const created = await createClientRequest({
        name: input.name,
        status: input.status,
      });

      setApiClients((current) => [...current, created]);

      return { ...created, primaryContactSlug: "" };
    };

    const updateClient = async (
      slug: string,
      input: ClientUpdateInput,
    ): Promise<ClientView> => {
      const existing = apiClients.find((client) => client.slug === slug);

      if (!existing) {
        throw new Error(`Client "${slug}" is no longer available.`);
      }

      const changes: UpdateClientBody = {};

      if (input.name !== existing.name) {
        changes.name = input.name;
      }

      if (input.status !== existing.status) {
        changes.status = input.status;
      }

      let updated = existing;

      // An unchanged name and status would be an empty PATCH body, which the API rejects.
      if (Object.keys(changes).length > 0) {
        updated = await updateClientRequest(slug, changes);

        setApiClients((current) =>
          current.map((client) => (client.slug === slug ? updated : client)),
        );

        if (updated.name !== existing.name) {
          cascadeClientRename(existing.name, updated.name);
        }
      }

      setPrimaryContactSlug(slug, input.primaryContactSlug);

      return { ...updated, primaryContactSlug: input.primaryContactSlug };
    };

    const addProject = (project: Project) => {
      persist((current) => {
        if (
          current.projects.some((existing) => existing.slug === project.slug)
        ) {
          return current;
        }

        return {
          ...current,
          projects: [...current.projects, project],
        };
      });
    };

    const addTask = (task: Task) => {
      persist((current) => {
        if (current.tasks.some((existing) => existing.slug === task.slug)) {
          return current;
        }

        return {
          ...current,
          tasks: [...current.tasks, task],
        };
      });
    };

    const updateTask = (slug: string, task: Task) => {
      persist((current) => ({
        ...current,
        tasks: current.tasks.map((currentTask) =>
          currentTask.slug === slug
            ? {
                id: currentTask.id,
                slug: currentTask.slug,
                title: task.title,
                project: task.project,
                client: task.client,
                assignee: task.assignee,
                dueDate: task.dueDate,
                priority: task.priority,
                status: task.status,
              }
            : currentTask,
        ),
      }));
    };

    const deleteTask = (slug: string) => {
      persist((current) => ({
        ...current,
        tasks: current.tasks.filter((task) => task.slug !== slug),
      }));
    };

    const addContact = (contact: Contact) => {
      persist((current) => {
        if (
          current.contacts.some((existing) => existing.slug === contact.slug)
        ) {
          return current;
        }

        return {
          ...current,
          contacts: [...current.contacts, contact],
        };
      });
    };

    const updateContact = (slug: string, contact: Contact) => {
      persist((current) => {
        const existingContact = current.contacts.find(
          (currentContact) => currentContact.slug === slug,
        );

        if (!existingContact) {
          return current;
        }

        return {
          ...current,
          contacts: current.contacts.map((currentContact) =>
            currentContact.slug === slug
              ? { ...contact, slug: currentContact.slug, id: currentContact.id }
              : currentContact,
          ),
        };
      });
    };

    // Clients live in PostgreSQL and are deliberately left untouched by a demo reset.
    const resetDemoData = () => {
      const seed = getSeedData();
      clearAppDataStorage();
      saveAppData(seed);
      setData(seed);
      setPrimaryContacts(resetClientPrimaryContacts());
    };

    return {
      addClient,
      updateClient,
      addProject,
      addTask,
      updateTask,
      deleteTask,
      addContact,
      updateContact,
      resetDemoData,
      getClientBySlug: (slug: string) =>
        clients.find((client) => client.slug === slug),
      getProjectBySlug: (slug: string) =>
        dataRef.current.projects.find((project) => project.slug === slug),
      getProjectByName: (name: string) =>
        dataRef.current.projects.find((project) => project.name === name),
      getTaskBySlug: (slug: string) =>
        dataRef.current.tasks.find((task) => task.slug === slug),
      getContactBySlug: (slug: string) =>
        dataRef.current.contacts.find((contact) => contact.slug === slug),
      getProjectsByClient: (clientName: string) =>
        dataRef.current.projects.filter(
          (project) => project.client === clientName,
        ),
      getContactsByClient: (clientName: string) =>
        dataRef.current.contacts.filter(
          (contact) => contact.client === clientName,
        ),
      getTasksByProject: (projectName: string) =>
        dataRef.current.tasks.filter((task) => task.project === projectName),
      getProjectNamesByClient: (clientName: string) =>
        dataRef.current.projects
          .filter((project) => project.client === clientName)
          .map((project) => project.name),
    };
  }, [apiClients, clients, persist]);

  const state = useMemo(
    () => ({
      clients,
      isLoadingClients,
      clientsError,
      projects: data.projects,
      tasks: data.tasks,
      contacts: data.contacts,
      isHydrated,
    }),
    [clients, clientsError, data, isHydrated, isLoadingClients],
  );

  return (
    <AppDataStateContext.Provider value={state}>
      <AppDataActionsContext.Provider value={actions}>
        {children}
      </AppDataActionsContext.Provider>
    </AppDataStateContext.Provider>
  );
}

export function useAppDataState(): AppDataState {
  const context = useContext(AppDataStateContext);

  if (!context) {
    throw new Error("useAppDataState must be used within an AppDataProvider");
  }

  return context;
}

export function useAppDataActions(): AppDataActions {
  const context = useContext(AppDataActionsContext);

  if (!context) {
    throw new Error("useAppDataActions must be used within an AppDataProvider");
  }

  return context;
}

export function useAppData(): AppDataState & AppDataActions {
  return { ...useAppDataState(), ...useAppDataActions() };
}
