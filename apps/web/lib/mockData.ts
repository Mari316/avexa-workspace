export type ClientStatus = "Active" | "On Hold";

export type Client = {
  name: string;
  slug: string;
  projectCount: number;
  primaryContact: string;
  contactEmail: string;
  status: ClientStatus;
};

export type ProjectStatus = "Active" | "On Hold";

export type Project = {
  name: string;
  slug: string;
  client: string;
  environment: string;
  taskCount: number;
  status: ProjectStatus;
};

export type TaskPriority = "High" | "Medium" | "Low";

export type TaskStatus = "To Do" | "In Progress" | "Review" | "Blocked" | "Done";

export type Task = {
  id: string;
  slug: string;
  title: string;
  project: string;
  client: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
};

export type ContactStatus = "Active" | "Inactive";

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  client: string;
  email: string;
  role: string;
  status: ContactStatus;
};

export const clients: Client[] = [
  {
    name: "Pax8",
    slug: "pax8",
    projectCount: 3,
    primaryContact: "Mitchell Lubbers",
    contactEmail: "mitchell.lubbers@pax8.com",
    status: "Active",
  },
  {
    name: "Cybertek",
    slug: "cybertek",
    projectCount: 1,
    primaryContact: "John Smith",
    contactEmail: "john.smith@cybertek.com",
    status: "Active",
  },
  {
    name: "OrangeHRM",
    slug: "orangehrm",
    projectCount: 1,
    primaryContact: "Sarah Lee",
    contactEmail: "sarah.lee@orangehrm.com",
    status: "Active",
  },
  {
    name: "Lemonade",
    slug: "lemonade",
    projectCount: 1,
    primaryContact: "Alex Brown",
    contactEmail: "alex.brown@lemonade.com",
    status: "On Hold",
  },
];

export const projects: Project[] = [
  {
    name: "Account Management",
    slug: "account-management",
    client: "Pax8",
    environment: "Staging",
    taskCount: 12,
    status: "Active",
  },
  {
    name: "Partner Portal",
    slug: "partner-portal",
    client: "Pax8",
    environment: "Staging",
    taskCount: 8,
    status: "Active",
  },
  {
    name: "Public API",
    slug: "public-api",
    client: "Pax8",
    environment: "QA",
    taskCount: 6,
    status: "Active",
  },
  {
    name: "OrangeHRM Automation",
    slug: "orangehrm-automation",
    client: "OrangeHRM",
    environment: "Demo",
    taskCount: 4,
    status: "Active",
  },
  {
    name: "Lemonade Web",
    slug: "lemonade-web",
    client: "Lemonade",
    environment: "Staging",
    taskCount: 3,
    status: "On Hold",
  },
];

export const tasks: Task[] = [
  {
    id: "task-1",
    slug: "finish-regression-coverage",
    title: "Finish regression coverage",
    project: "Account Management",
    client: "Pax8",
    assignee: "Mari",
    dueDate: "Aug 8",
    priority: "High",
    status: "In Progress",
  },
  {
    id: "task-2",
    slug: "review-automation-pr",
    title: "Review automation PR",
    project: "Partner Portal",
    client: "Pax8",
    assignee: "Chris",
    dueDate: "Aug 9",
    priority: "Medium",
    status: "Review",
  },
  {
    id: "task-3",
    slug: "update-playwright-tests",
    title: "Update Playwright tests",
    project: "OrangeHRM Automation",
    client: "OrangeHRM",
    assignee: "Mari",
    dueDate: "Aug 12",
    priority: "Medium",
    status: "To Do",
  },
  {
    id: "task-4",
    slug: "investigate-login-bug",
    title: "Investigate login bug",
    project: "Lemonade Web",
    client: "Lemonade",
    assignee: "Alex",
    dueDate: "Aug 7",
    priority: "High",
    status: "Blocked",
  },
  {
    id: "task-5",
    slug: "validate-api-regression",
    title: "Validate API regression",
    project: "Public API",
    client: "Pax8",
    assignee: "Mari",
    dueDate: "Aug 15",
    priority: "Low",
    status: "To Do",
  },
];

export const clientProjects: Record<string, string[]> = {
  Pax8: ["Account Management", "Partner Portal", "Public API"],
  OrangeHRM: ["OrangeHRM Automation"],
  Lemonade: ["Lemonade Web"],
  Cybertek: ["Cybertek Automation"],
};

export const contacts: Contact[] = [
  {
    id: "contact-1",
    firstName: "Mitchell",
    lastName: "Lubbers",
    client: "Pax8",
    email: "mitchell.lubbers@pax8.com",
    role: "QA Director",
    status: "Active",
  },
  {
    id: "contact-2",
    firstName: "Jennifer",
    lastName: "Walsh",
    client: "Pax8",
    email: "jennifer.walsh@pax8.com",
    role: "Partner Success Manager",
    status: "Active",
  },
  {
    id: "contact-3",
    firstName: "John",
    lastName: "Smith",
    client: "Cybertek",
    email: "john.smith@cybertek.com",
    role: "Engineering Lead",
    status: "Active",
  },
  {
    id: "contact-4",
    firstName: "Emily",
    lastName: "Chen",
    client: "Cybertek",
    email: "emily.chen@cybertek.com",
    role: "Automation Engineer",
    status: "Active",
  },
  {
    id: "contact-5",
    firstName: "Sarah",
    lastName: "Lee",
    client: "OrangeHRM",
    email: "sarah.lee@orangehrm.com",
    role: "Product Owner",
    status: "Active",
  },
  {
    id: "contact-6",
    firstName: "Alex",
    lastName: "Brown",
    client: "Lemonade",
    email: "alex.brown@lemonade.com",
    role: "QA Manager",
    status: "Inactive",
  },
];

export function getClientSlug(name: string): string {
  return name.toLowerCase();
}

export function getProjectSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function getTaskSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-");
}

export function getClientBySlug(slug: string): Client | undefined {
  return clients.find((client) => client.slug === slug);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getProjectByName(name: string): Project | undefined {
  return projects.find((project) => project.name === name);
}

export function getTaskBySlug(slug: string): Task | undefined {
  return tasks.find((task) => task.slug === slug);
}

export function getProjectsByClient(clientName: string): Project[] {
  return projects.filter((project) => project.client === clientName);
}

export function getContactsByClient(clientName: string): Contact[] {
  return contacts.filter((contact) => contact.client === clientName);
}

export function getTasksByProject(projectName: string): Task[] {
  return tasks.filter((task) => task.project === projectName);
}

export function formatContactName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}
