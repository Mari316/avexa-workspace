"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
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
  createProject as createProjectRequest,
  listProjects as listProjectsRequest,
  type CreateProjectBody,
  type ProjectDTO,
} from "../lib/api/projects";
import {
  createTask as createTaskRequest,
  deleteTask as deleteTaskRequest,
  listTasks as listTasksRequest,
  updateTask as updateTaskRequest,
  type CreateTaskBody,
  type TaskDTO,
  type UpdateTaskBody,
} from "../lib/api/tasks";
import type { ClientStatus } from "../lib/mockData";

/** All four core domains are database records used as-is from the API. */
export type ClientView = ClientDTO;
export type ContactView = ContactDTO;
export type ProjectView = ProjectDTO;
export type TaskView = TaskDTO;

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
  projects: ProjectView[];
  isLoadingProjects: boolean;
  projectsError: string;
  tasks: TaskView[];
  isLoadingTasks: boolean;
  tasksError: string;
};

type AppDataActions = {
  addClient: (input: ClientCreateInput) => Promise<ClientView>;
  updateClient: (slug: string, input: ClientUpdateInput) => Promise<ClientView>;
  addProject: (input: CreateProjectBody) => Promise<ProjectView>;
  addTask: (input: CreateTaskBody) => Promise<TaskView>;
  updateTask: (slug: string, input: UpdateTaskBody) => Promise<TaskView>;
  deleteTask: (slug: string) => Promise<void>;
  addContact: (input: CreateContactBody) => Promise<ContactView>;
  updateContact: (
    slug: string,
    input: UpdateContactBody,
  ) => Promise<ContactView>;
  getProjectBySlug: (slug: string) => ProjectView | undefined;
  getProjectById: (id: string) => ProjectView | undefined;
  getTaskBySlug: (slug: string) => TaskView | undefined;
  getClientBySlug: (slug: string) => ClientView | undefined;
  getContactBySlug: (slug: string) => ContactView | undefined;
  getProjectsByClientId: (clientId: string) => ProjectView[];
  getContactsByClientId: (clientId: string) => ContactView[];
  getTasksByProjectId: (projectId: string) => TaskView[];
};

const AppDataStateContext = createContext<AppDataState | null>(null);
const AppDataActionsContext = createContext<AppDataActions | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientView[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState("");

  const [contacts, setContacts] = useState<ContactView[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState("");

  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState("");

  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [tasksError, setTasksError] = useState("");

  useEffect(() => {
    // Clear retired workspace localStorage keys from earlier steps.
    if (typeof window !== "undefined") {
      for (const key of [
        "avexa.workspace.v2",
        "avexa.workspace.v1",
        "avexa-app-data",
        "avexa.clientPrimaryContacts.v1",
      ]) {
        localStorage.removeItem(key);
      }
    }
  }, []);

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

  useEffect(() => {
    let cancelled = false;

    listProjectsRequest()
      .then((rows) => {
        if (!cancelled) {
          setProjects(rows);
          setProjectsError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjectsError("Unable to load projects. Please refresh the page.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingProjects(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    listTasksRequest()
      .then((rows) => {
        if (!cancelled) {
          setTasks(rows);
          setTasksError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTasksError("Unable to load tasks. Please refresh the page.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingTasks(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const actions = useMemo<AppDataActions>(() => {
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
      }

      return updated;
    };

    const addProject = async (
      input: CreateProjectBody,
    ): Promise<ProjectView> => {
      const created = await createProjectRequest(input);

      setProjects((current) => [...current, created]);

      return created;
    };

    const addTask = async (input: CreateTaskBody): Promise<TaskView> => {
      const created = await createTaskRequest(input);

      setTasks((current) => [...current, created]);

      return created;
    };

    const updateTask = async (
      slug: string,
      input: UpdateTaskBody,
    ): Promise<TaskView> => {
      const updated = await updateTaskRequest(slug, input);

      setTasks((current) =>
        current.map((task) => (task.slug === slug ? updated : task)),
      );

      return updated;
    };

    const deleteTask = async (slug: string): Promise<void> => {
      await deleteTaskRequest(slug);

      setTasks((current) => current.filter((task) => task.slug !== slug));
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

    return {
      addClient,
      updateClient,
      addProject,
      addTask,
      updateTask,
      deleteTask,
      addContact,
      updateContact,
      getClientBySlug: (slug: string) =>
        clients.find((client) => client.slug === slug),
      getProjectBySlug: (slug: string) =>
        projects.find((project) => project.slug === slug),
      getProjectById: (id: string) =>
        projects.find((project) => project.id === id),
      getTaskBySlug: (slug: string) => tasks.find((task) => task.slug === slug),
      getContactBySlug: (slug: string) =>
        contacts.find((contact) => contact.slug === slug),
      getProjectsByClientId: (clientId: string) =>
        projects.filter((project) => project.clientId === clientId),
      getContactsByClientId: (clientId: string) =>
        contacts.filter((contact) => contact.clientId === clientId),
      getTasksByProjectId: (projectId: string) =>
        tasks.filter((task) => task.projectId === projectId),
    };
  }, [clients, contacts, projects, tasks]);

  const state = useMemo(
    () => ({
      clients,
      isLoadingClients,
      clientsError,
      contacts,
      isLoadingContacts,
      contactsError,
      projects,
      isLoadingProjects,
      projectsError,
      tasks,
      isLoadingTasks,
      tasksError,
    }),
    [
      clients,
      clientsError,
      contacts,
      contactsError,
      isLoadingClients,
      isLoadingContacts,
      isLoadingProjects,
      isLoadingTasks,
      projects,
      projectsError,
      tasks,
      tasksError,
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
