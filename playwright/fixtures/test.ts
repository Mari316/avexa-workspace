import { test as base, expect } from "@playwright/test";

import { ClientsApi } from "../api/clients.api.js";
import { ContactsApi } from "../api/contacts.api.js";
import { ProjectsApi } from "../api/projects.api.js";
import { TasksApi } from "../api/tasks.api.js";

type ApiFixtures = {
  tasksApi: TasksApi;
  clientsApi: ClientsApi;
  projectsApi: ProjectsApi;
  contactsApi: ContactsApi;
};

export const test = base.extend<ApiFixtures>({
  tasksApi: async ({ request }, use) => {
    await use(new TasksApi(request));
  },
  clientsApi: async ({ request }, use) => {
    await use(new ClientsApi(request));
  },
  projectsApi: async ({ request }, use) => {
    await use(new ProjectsApi(request));
  },
  contactsApi: async ({ request }, use) => {
    await use(new ContactsApi(request));
  },
});

export { expect };
