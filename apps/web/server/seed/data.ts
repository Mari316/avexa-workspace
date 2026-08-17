/**
 * Deterministic database seed definitions. Kept separate from UI mock helpers so
 * the server seed does not depend on frontend display types that diverge from DTOs.
 */

export type SeedClientStatus = "Active" | "On Hold";
export type SeedContactStatus = "Active" | "Inactive";
export type SeedProjectStatus = "Active" | "On Hold";
export type SeedProjectEnvironment =
  | "Development"
  | "QA"
  | "Staging"
  | "Production"
  | "Demo";
export type SeedTaskPriority = "High" | "Medium" | "Low";
export type SeedTaskStatus =
  | "To Do"
  | "In Progress"
  | "Review"
  | "Blocked"
  | "Done";
export type SeedTaskAssignee = "Mari" | "Chris" | "Alex";

export type SeedClient = {
  slug: string;
  name: string;
  status: SeedClientStatus;
  primaryContactSlug: string;
};

export type SeedContact = {
  slug: string;
  firstName: string;
  lastName: string;
  /** Owning client slug — resolved to client_id at seed time. */
  clientSlug: string;
  email: string;
  role: string;
  status: SeedContactStatus;
};

export type SeedProject = {
  slug: string;
  name: string;
  /** Owning client slug — resolved to client_id at seed time. */
  clientSlug: string;
  environment: SeedProjectEnvironment;
  status: SeedProjectStatus;
};

export type SeedTask = {
  slug: string;
  title: string;
  /** Owning project slug — resolved to project_id at seed time. */
  projectSlug: string;
  assignee: SeedTaskAssignee;
  /** ISO calendar date YYYY-MM-DD. */
  dueDate: string;
  priority: SeedTaskPriority;
  status: SeedTaskStatus;
};

/** Fixed ids keep seeded rows addressable from future API/Playwright fixtures. */
export const SEED_CLIENT_IDS: Record<string, string> = {
  pax8: "11111111-1111-4111-8111-111111111111",
  cybertek: "22222222-2222-4222-8222-222222222222",
  orangehrm: "33333333-3333-4333-8333-333333333333",
  lemonade: "44444444-4444-4444-8444-444444444444",
};

export const SEED_CONTACT_IDS: Record<string, string> = {
  "mitchell-lubbers": "55555555-5555-4555-8555-555555555555",
  "jennifer-walsh": "66666666-6666-4666-8666-666666666666",
  "john-smith": "77777777-7777-4777-8777-777777777777",
  "emily-chen": "88888888-8888-4888-8888-888888888888",
  "sarah-lee": "99999999-9999-4999-8999-999999999999",
  "alex-brown": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
};

export const SEED_PROJECT_IDS: Record<string, string> = {
  "account-management": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "partner-portal": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "public-api": "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  "orangehrm-automation": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  "lemonade-web": "ffffffff-ffff-4fff-8fff-ffffffffffff",
};

export const SEED_TASK_IDS: Record<string, string> = {
  "finish-regression-coverage": "10101010-1010-4010-8010-101010101010",
  "review-automation-pr": "20202020-2020-4020-8020-202020202020",
  "update-playwright-tests": "30303030-3030-4030-8030-303030303030",
  "investigate-login-bug": "40404040-4040-4040-8040-404040404040",
  "validate-api-regression": "50505050-5050-4050-8050-505050505050",
};

export const seedClients: SeedClient[] = [
  {
    slug: "pax8",
    name: "Pax8",
    status: "Active",
    primaryContactSlug: "mitchell-lubbers",
  },
  {
    slug: "cybertek",
    name: "Cybertek",
    status: "Active",
    primaryContactSlug: "john-smith",
  },
  {
    slug: "orangehrm",
    name: "OrangeHRM",
    status: "Active",
    primaryContactSlug: "sarah-lee",
  },
  {
    slug: "lemonade",
    name: "Lemonade",
    status: "On Hold",
    primaryContactSlug: "alex-brown",
  },
];

export const seedContacts: SeedContact[] = [
  {
    slug: "mitchell-lubbers",
    firstName: "Mitchell",
    lastName: "Lubbers",
    clientSlug: "pax8",
    email: "mitchell.lubbers@pax8.com",
    role: "QA Director",
    status: "Active",
  },
  {
    slug: "jennifer-walsh",
    firstName: "Jennifer",
    lastName: "Walsh",
    clientSlug: "pax8",
    email: "jennifer.walsh@pax8.com",
    role: "Partner Success Manager",
    status: "Active",
  },
  {
    slug: "john-smith",
    firstName: "John",
    lastName: "Smith",
    clientSlug: "cybertek",
    email: "john.smith@cybertek.com",
    role: "Engineering Lead",
    status: "Active",
  },
  {
    slug: "emily-chen",
    firstName: "Emily",
    lastName: "Chen",
    clientSlug: "cybertek",
    email: "emily.chen@cybertek.com",
    role: "Automation Engineer",
    status: "Active",
  },
  {
    slug: "sarah-lee",
    firstName: "Sarah",
    lastName: "Lee",
    clientSlug: "orangehrm",
    email: "sarah.lee@orangehrm.com",
    role: "Product Owner",
    status: "Active",
  },
  {
    slug: "alex-brown",
    firstName: "Alex",
    lastName: "Brown",
    clientSlug: "lemonade",
    email: "alex.brown@lemonade.com",
    role: "QA Manager",
    status: "Inactive",
  },
];

export const seedProjects: SeedProject[] = [
  {
    slug: "account-management",
    name: "Account Management",
    clientSlug: "pax8",
    environment: "Staging",
    status: "Active",
  },
  {
    slug: "partner-portal",
    name: "Partner Portal",
    clientSlug: "pax8",
    environment: "Staging",
    status: "Active",
  },
  {
    slug: "public-api",
    name: "Public API",
    clientSlug: "pax8",
    environment: "QA",
    status: "Active",
  },
  {
    slug: "orangehrm-automation",
    name: "OrangeHRM Automation",
    clientSlug: "orangehrm",
    environment: "Demo",
    status: "Active",
  },
  {
    slug: "lemonade-web",
    name: "Lemonade Web",
    clientSlug: "lemonade",
    environment: "Staging",
    status: "On Hold",
  },
];

export const seedTasks: SeedTask[] = [
  {
    slug: "finish-regression-coverage",
    title: "Finish regression coverage",
    projectSlug: "account-management",
    assignee: "Mari",
    dueDate: "2026-08-08",
    priority: "High",
    status: "In Progress",
  },
  {
    slug: "review-automation-pr",
    title: "Review automation PR",
    projectSlug: "partner-portal",
    assignee: "Chris",
    dueDate: "2026-08-09",
    priority: "Medium",
    status: "Review",
  },
  {
    slug: "update-playwright-tests",
    title: "Update Playwright tests",
    projectSlug: "orangehrm-automation",
    assignee: "Mari",
    dueDate: "2026-08-12",
    priority: "Medium",
    status: "To Do",
  },
  {
    slug: "investigate-login-bug",
    title: "Investigate login bug",
    projectSlug: "lemonade-web",
    assignee: "Alex",
    dueDate: "2026-08-07",
    priority: "High",
    status: "Blocked",
  },
  {
    slug: "validate-api-regression",
    title: "Validate API regression",
    projectSlug: "public-api",
    assignee: "Mari",
    dueDate: "2026-08-15",
    priority: "Low",
    status: "To Do",
  },
];

export function seedClientId(slug: string): string {
  const id = SEED_CLIENT_IDS[slug];

  if (!id) {
    throw new Error(
      `Seed client "${slug}" has no fixed id. Add it to SEED_CLIENT_IDS to keep the seed deterministic.`,
    );
  }

  return id;
}

export function seedContactId(slug: string): string {
  const id = SEED_CONTACT_IDS[slug];

  if (!id) {
    throw new Error(
      `Seed contact "${slug}" has no fixed id. Add it to SEED_CONTACT_IDS to keep the seed deterministic.`,
    );
  }

  return id;
}

export function seedProjectId(slug: string): string {
  const id = SEED_PROJECT_IDS[slug];

  if (!id) {
    throw new Error(
      `Seed project "${slug}" has no fixed id. Add it to SEED_PROJECT_IDS to keep the seed deterministic.`,
    );
  }

  return id;
}

export function seedTaskId(slug: string): string {
  const id = SEED_TASK_IDS[slug];

  if (!id) {
    throw new Error(
      `Seed task "${slug}" has no fixed id. Add it to SEED_TASK_IDS to keep the seed deterministic.`,
    );
  }

  return id;
}
