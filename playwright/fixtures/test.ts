import { test as base, expect } from "@playwright/test";

import {
  ClientsApi,
  readCreatedClient,
  type CreatedClient,
} from "../api/clients.api.js";
import { AuditLogApi } from "../api/audit-log.api.js";
import { ContactsApi } from "../api/contacts.api.js";
import { DashboardApi } from "../api/dashboard.api.js";
import { NotesApi } from "../api/notes.api.js";
import { ProjectsApi } from "../api/projects.api.js";
import { ResourcesApi } from "../api/resources.api.js";
import { SettingsApi } from "../api/settings.api.js";
import { TasksApi } from "../api/tasks.api.js";
import { TeamApi } from "../api/team.api.js";
import { buildClient } from "../data/client.factory.js";
import { ClientsPage } from "../pages/clients.page.js";
import { ContactsPage } from "../pages/contacts.page.js";
import { NotesPage } from "../pages/notes.page.js";
import { ProjectsPage } from "../pages/projects.page.js";
import { TaskDetailsPage } from "../pages/task-details.page.js";
import { TasksPage } from "../pages/tasks.page.js";
import { cleanupTestData } from "../support/db/cleanup.js";

type Fixtures = {
  tasksApi: TasksApi;
  clientsApi: ClientsApi;
  projectsApi: ProjectsApi;
  contactsApi: ContactsApi;
  notesApi: NotesApi;
  dashboardApi: DashboardApi;
  auditLogApi: AuditLogApi;
  settingsApi: SettingsApi;
  resourcesApi: ResourcesApi;
  teamApi: TeamApi;
  clientsPage: ClientsPage;
  contactsPage: ContactsPage;
  projectsPage: ProjectsPage;
  tasksPage: TasksPage;
  taskDetailsPage: TaskDetailsPage;
  notesPage: NotesPage;
  client: CreatedClient;
};

export const test = base.extend<Fixtures>({
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
  notesApi: async ({ request }, use) => {
    await use(new NotesApi(request));
  },
  dashboardApi: async ({ request }, use) => {
    await use(new DashboardApi(request));
  },
  auditLogApi: async ({ request }, use) => {
    await use(new AuditLogApi(request));
  },
  settingsApi: async ({ request }, use) => {
    await use(new SettingsApi(request));
  },
  resourcesApi: async ({ request }, use) => {
    await use(new ResourcesApi(request));
  },
  teamApi: async ({ request }, use) => {
    await use(new TeamApi(request));
  },
  clientsPage: async ({ page }, use) => {
    await use(new ClientsPage(page));
  },
  contactsPage: async ({ page }, use) => {
    await use(new ContactsPage(page));
  },
  projectsPage: async ({ page }, use) => {
    await use(new ProjectsPage(page));
  },
  tasksPage: async ({ page }, use) => {
    await use(new TasksPage(page));
  },
  taskDetailsPage: async ({ page }, use) => {
    await use(new TaskDetailsPage(page));
  },
  notesPage: async ({ page }, use) => {
    await use(new NotesPage(page));
  },
  client: async ({ clientsApi }, use) => {
    const payload = buildClient();
    const response = await clientsApi.createClient(payload);

    if (response.status() !== 201) {
      throw new Error(
        `Failed to create owned client for fixture setup: HTTP ${response.status()}`,
      );
    }

    const created = await readCreatedClient(response);

    await use(created);

    await cleanupTestData({ clientSlugs: [created.slug] });
  },
});

export { expect };
