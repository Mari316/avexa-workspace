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
  createContact as createContactRequest,
  listContacts as listContactsRequest,
  updateContact as updateContactRequest,
  type ContactDTO,
  type CreateContactBody,
  type UpdateContactBody,
} from "../lib/api/contacts";
import {
  clearAppDataStorage,
  getSeedData,
  loadAppData,
  saveAppData,
  type StoredAppData,
} from "../lib/appDataStorage";
import type { ClientStatus, Project, Task } from "../lib/mockData";

/** Clients and contacts are database records; both are used as-is from the API. */
export type ClientView = ClientDTO;
export type ContactView = ContactDTO;

export type ClientCreateInput = {
  name: string;
  status: ClientStatus;
};

export type ClientUpdateInput = {
  name: string;
  status: ClientStatus;
  primaryContactId: string | null;
};

type AppDataState = {
  clients: ClientView[];
  isLoadingClients: boolean;
  clientsError: string;
  contacts: ContactView[];
  isLoadingContacts: boolean;
  contactsError: string;
  projects: Project[];
  tasks: Task[];
  isHydrated: boolean;
};

type AppDataActions = {
  addClient: (input: ClientCreateInput) => Promise<ClientView>;
  updateClient: (slug: string, input: ClientUpdateInput) => Promise<ClientView>;
  addProject: (project: Project) => void;
  addTask: (task: Task) => void;
  updateTask: (slug: string, task: Task) => void;
  deleteTask: (slug: string) => void;
  addContact: (input: CreateContactBody) => Promise<ContactView>;
  updateContact: (
    slug: string,
    input: UpdateContactBody,
  ) => Promise<ContactView>;
  resetDemoData: () => void;
  getProjectBySlug: (slug: string) => Project | undefined;
  getProjectByName: (name: string) => Project | undefined;
  getTaskBySlug: (slug: string) => Task | undefined;
  getClientBySlug: (slug: string) => ClientView | undefined;
  getContactBySlug: (slug: string) => ContactView | undefined;
  getProjectsByClient: (clientName: string) => Project[];
  getContactsByClientId: (clientId: string) => ContactView[];
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

  // Clients and contacts come from PostgreSQL, so both start empty rather than seeded.
  const [clients, setClients] = useState<ClientView[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState("");

  const [contacts, setContacts] = useState<ContactView[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState("");

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    setData(loadAppData(seedData));
    setIsHydrated(true);
  }, [seedData]);

  useEffect(() => {
    let cancelled = false;

    listClientsRequest()
      .then((rows) => {
        if (!cancelled) {
          setClients(rows);
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

  useEffect(() => {
    let cancelled = false;

    listContactsRequest()
      .then((rows) => {
        if (!cancelled) {
          setContacts(rows);
          setContactsError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContactsError("Unable to load contacts. Please refresh the page.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingContacts(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
     * Temporary compatibility: projects and tasks still store their client as a
     * name string in localStorage, so a rename in PostgreSQL has to be mirrored
     * into them. Contacts now use clientId and are no longer rewritten here.
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
      }));
    };

    const addClient = async (input: ClientCreateInput): Promise<ClientView> => {
      const created = await createClientRequest({
        name: input.name,
        status: input.status,
      });

      setClients((current) => [...current, created]);

      return created;
    };

    const updateClient = async (
      slug: string,
      input: ClientUpdateInput,
    ): Promise<ClientView> => {
      const existing = clients.find((client) => client.slug === slug);

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

      if (input.primaryContactId !== existing.primaryContactId) {
        changes.primaryContactId = input.primaryContactId;
      }

      let updated = existing;

      // An unchanged payload would be an empty PATCH body, which the API rejects.
      if (Object.keys(changes).length > 0) {
        updated = await updateClientRequest(slug, changes);

        setClients((current) =>
          current.map((client) => (client.slug === slug ? updated : client)),
        );

        if (updated.name !== existing.name) {
          cascadeClientRename(existing.name, updated.name);
        }
      }

      return updated;
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

    const addContact = async (
      input: CreateContactBody,
    ): Promise<ContactView> => {
      const created = await createContactRequest(input);

      setContacts((current) => [...current, created]);

      return created;
    };

    const updateContact = async (
      slug: string,
      input: UpdateContactBody,
    ): Promise<ContactView> => {
      const updated = await updateContactRequest(slug, input);

      setContacts((current) =>
        current.map((contact) => (contact.slug === slug ? updated : contact)),
      );

      return updated;
    };

    // Clients and contacts live in PostgreSQL and are deliberately left
    // untouched by a demo reset.
    const resetDemoData = () => {
      const seed = getSeedData();
      clearAppDataStorage();
      saveAppData(seed);
      setData(seed);
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
        contacts.find((contact) => contact.slug === slug),
      getProjectsByClient: (clientName: string) =>
        dataRef.current.projects.filter(
          (project) => project.client === clientName,
        ),
      getContactsByClientId: (clientId: string) =>
        contacts.filter((contact) => contact.clientId === clientId),
      getTasksByProject: (projectName: string) =>
        dataRef.current.tasks.filter((task) => task.project === projectName),
      getProjectNamesByClient: (clientName: string) =>
        dataRef.current.projects
          .filter((project) => project.client === clientName)
          .map((project) => project.name),
    };
  }, [clients, contacts, persist]);

  const state = useMemo(
    () => ({
      clients,
      isLoadingClients,
      clientsError,
      contacts,
      isLoadingContacts,
      contactsError,
      projects: data.projects,
      tasks: data.tasks,
      isHydrated,
    }),
    [
      clients,
      clientsError,
      contacts,
      contactsError,
      data,
      isHydrated,
      isLoadingClients,
      isLoadingContacts,
    ],
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
