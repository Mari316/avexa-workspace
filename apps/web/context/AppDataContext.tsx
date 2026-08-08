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
  clearAppDataStorage,
  getSeedData,
  loadAppData,
  saveAppData,
  type StoredAppData,
} from "../lib/appDataStorage";
import type { Client, Contact, Project, Task } from "../lib/mockData";

type AppDataState = {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  contacts: Contact[];
  isHydrated: boolean;
};

type AppDataActions = {
  addClient: (client: Client) => void;
  updateClient: (slug: string, client: Client) => void;
  addProject: (project: Project) => void;
  addTask: (task: Task) => void;
  updateTask: (slug: string, task: Task) => void;
  deleteTask: (slug: string) => void;
  addContact: (contact: Contact) => void;
  updateContact: (slug: string, contact: Contact) => void;
  resetDemoData: () => void;
  getClientBySlug: (slug: string) => Client | undefined;
  getProjectBySlug: (slug: string) => Project | undefined;
  getProjectByName: (name: string) => Project | undefined;
  getTaskBySlug: (slug: string) => Task | undefined;
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

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    setData(loadAppData(seedData));
    setIsHydrated(true);
  }, [seedData]);

  const persist = useCallback((updater: (current: StoredAppData) => StoredAppData) => {
    setData((current) => {
      const next = updater(current);
      saveAppData(next);
      return next;
    });
  }, []);

  const actions = useMemo<AppDataActions>(() => {
    const addClient = (client: Client) => {
      persist((current) => {
        if (current.clients.some((existing) => existing.slug === client.slug)) {
          return current;
        }

        return {
          ...current,
          clients: [...current.clients, client],
        };
      });
    };

    const updateClient = (slug: string, client: Client) => {
      persist((current) => {
        const existingClient = current.clients.find(
          (currentClient) => currentClient.slug === slug,
        );

        if (!existingClient) {
          return current;
        }

        const previousName = existingClient.name;
        const nextName = client.name;

        return {
          ...current,
          clients: current.clients.map((currentClient) =>
            currentClient.slug === slug
              ? {
                  name: client.name,
                  slug: currentClient.slug,
                  projectCount: client.projectCount,
                  primaryContactSlug: client.primaryContactSlug,
                  status: client.status,
                }
              : currentClient,
          ),
          projects:
            previousName === nextName
              ? current.projects
              : current.projects.map((project) =>
                  project.client === previousName
                    ? { ...project, client: nextName }
                    : project,
                ),
          tasks:
            previousName === nextName
              ? current.tasks
              : current.tasks.map((task) =>
                  task.client === previousName
                    ? { ...task, client: nextName }
                    : task,
                ),
          contacts:
            previousName === nextName
              ? current.contacts
              : current.contacts.map((contact) =>
                  contact.client === previousName
                    ? { ...contact, client: nextName }
                    : contact,
                ),
        };
      });
    };

    const addProject = (project: Project) => {
      persist((current) => {
        if (current.projects.some((existing) => existing.slug === project.slug)) {
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
        if (current.contacts.some((existing) => existing.slug === contact.slug)) {
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
        dataRef.current.clients.find((client) => client.slug === slug),
      getProjectBySlug: (slug: string) =>
        dataRef.current.projects.find((project) => project.slug === slug),
      getProjectByName: (name: string) =>
        dataRef.current.projects.find((project) => project.name === name),
      getTaskBySlug: (slug: string) =>
        dataRef.current.tasks.find((task) => task.slug === slug),
      getContactBySlug: (slug: string) =>
        dataRef.current.contacts.find((contact) => contact.slug === slug),
      getProjectsByClient: (clientName: string) =>
        dataRef.current.projects.filter((project) => project.client === clientName),
      getContactsByClient: (clientName: string) =>
        dataRef.current.contacts.filter((contact) => contact.client === clientName),
      getTasksByProject: (projectName: string) =>
        dataRef.current.tasks.filter((task) => task.project === projectName),
      getProjectNamesByClient: (clientName: string) =>
        dataRef.current.projects
          .filter((project) => project.client === clientName)
          .map((project) => project.name),
    };
  }, [persist]);

  const state = useMemo(
    () => ({
      clients: data.clients,
      projects: data.projects,
      tasks: data.tasks,
      contacts: data.contacts,
      isHydrated,
    }),
    [data, isHydrated],
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
