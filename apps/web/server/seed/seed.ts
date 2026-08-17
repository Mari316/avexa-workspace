import { and, eq, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import { closeDatabase, db } from "../db";
import {
  account,
  clients,
  contacts,
  projects,
  tasks,
  user,
  type NewClientRow,
  type NewContactRow,
  type NewProjectRow,
  type NewTaskRow,
} from "../db/schema";
import {
  DEMO_USER_PASSWORD,
  seedClientId,
  seedClients,
  seedContactId,
  seedContacts,
  seedProjectId,
  seedProjects,
  seedTaskId,
  seedTasks,
  seedUsers,
  type SeedClient,
  type SeedContact,
  type SeedProject,
  type SeedTask,
} from "./data";

function toClientRow(client: SeedClient): NewClientRow {
  return {
    id: seedClientId(client.slug),
    slug: client.slug,
    name: client.name,
    status: client.status,
  };
}

function toContactRow(contact: SeedContact): NewContactRow {
  return {
    id: seedContactId(contact.slug),
    slug: contact.slug,
    firstName: contact.firstName,
    lastName: contact.lastName,
    clientId: seedClientId(contact.clientSlug),
    email: contact.email,
    role: contact.role,
    status: contact.status,
  };
}

function toProjectRow(project: SeedProject): NewProjectRow {
  return {
    id: seedProjectId(project.slug),
    slug: project.slug,
    name: project.name,
    clientId: seedClientId(project.clientSlug),
    environment: project.environment,
    status: project.status,
  };
}

function toTaskRow(task: SeedTask): NewTaskRow {
  return {
    id: seedTaskId(task.slug),
    slug: task.slug,
    title: task.title,
    projectId: seedProjectId(task.projectSlug),
    assignee: task.assignee,
    dueDate: task.dueDate,
    priority: task.priority,
    status: task.status,
  };
}

/**
 * Upserts on the client slug, so re-running never inserts duplicates. The `setWhere`
 * guard skips the UPDATE entirely when the stored row already matches the seed, which
 * keeps `updated_at` untouched on repeat runs.
 */
export async function seedClientsTable(): Promise<void> {
  for (const client of seedClients) {
    await db
      .insert(clients)
      .values(toClientRow(client))
      .onConflictDoUpdate({
        target: clients.slug,
        set: {
          name: sql`excluded.name`,
          status: sql`excluded.status`,
          updatedAt: sql`now()`,
        },
        setWhere: sql`clients.name IS DISTINCT FROM excluded.name
          OR clients.status IS DISTINCT FROM excluded.status`,
      });
  }
}

export async function seedContactsTable(): Promise<void> {
  for (const contact of seedContacts) {
    await db
      .insert(contacts)
      .values(toContactRow(contact))
      .onConflictDoUpdate({
        target: contacts.slug,
        set: {
          firstName: sql`excluded.first_name`,
          lastName: sql`excluded.last_name`,
          clientId: sql`excluded.client_id`,
          email: sql`excluded.email`,
          role: sql`excluded.role`,
          status: sql`excluded.status`,
          updatedAt: sql`now()`,
        },
        setWhere: sql`contacts.first_name IS DISTINCT FROM excluded.first_name
          OR contacts.last_name IS DISTINCT FROM excluded.last_name
          OR contacts.client_id IS DISTINCT FROM excluded.client_id
          OR contacts.email IS DISTINCT FROM excluded.email
          OR contacts.role IS DISTINCT FROM excluded.role
          OR contacts.status IS DISTINCT FROM excluded.status`,
      });
  }
}

/**
 * Must run after both tables exist: the composite foreign key only accepts a contact
 * that already belongs to the client. `updated_at` is deliberately left alone, so a
 * freshly seeded database keeps `created_at = updated_at` on every row.
 */
export async function seedPrimaryContacts(): Promise<void> {
  for (const client of seedClients) {
    if (!client.primaryContactSlug) {
      continue;
    }

    const clientId = seedClientId(client.slug);
    const contactId = seedContactId(client.primaryContactSlug);

    await db
      .update(clients)
      .set({ primaryContactId: contactId })
      .where(
        and(
          eq(clients.id, clientId),
          sql`${clients.primaryContactId} IS DISTINCT FROM ${contactId}::uuid`,
        ),
      );
  }
}

export async function seedProjectsTable(): Promise<void> {
  for (const project of seedProjects) {
    await db
      .insert(projects)
      .values(toProjectRow(project))
      .onConflictDoUpdate({
        target: projects.slug,
        set: {
          name: sql`excluded.name`,
          clientId: sql`excluded.client_id`,
          environment: sql`excluded.environment`,
          status: sql`excluded.status`,
          updatedAt: sql`now()`,
        },
        setWhere: sql`projects.name IS DISTINCT FROM excluded.name
          OR projects.client_id IS DISTINCT FROM excluded.client_id
          OR projects.environment IS DISTINCT FROM excluded.environment
          OR projects.status IS DISTINCT FROM excluded.status`,
      });
  }
}

export async function seedTasksTable(): Promise<void> {
  for (const task of seedTasks) {
    await db
      .insert(tasks)
      .values(toTaskRow(task))
      .onConflictDoUpdate({
        target: tasks.slug,
        set: {
          title: sql`excluded.title`,
          projectId: sql`excluded.project_id`,
          assignee: sql`excluded.assignee`,
          dueDate: sql`excluded.due_date`,
          priority: sql`excluded.priority`,
          status: sql`excluded.status`,
          updatedAt: sql`now()`,
        },
        setWhere: sql`tasks.title IS DISTINCT FROM excluded.title
          OR tasks.project_id IS DISTINCT FROM excluded.project_id
          OR tasks.assignee IS DISTINCT FROM excluded.assignee
          OR tasks.due_date IS DISTINCT FROM excluded.due_date
          OR tasks.priority IS DISTINCT FROM excluded.priority
          OR tasks.status IS DISTINCT FROM excluded.status`,
      });
  }
}

/**
 * Creates Better Auth credential users using the library's own password hasher.
 * Existing users keep their password hashes; role is upserted so repeat seeds
 * stay idempotent and match the deterministic RBAC assignments.
 * Public sign-up remains disabled in auth config — only this seed creates users.
 */
export async function seedAuthUsers(): Promise<void> {
  for (const seedUser of seedUsers) {
    const [existing] = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.email, seedUser.email))
      .limit(1);

    if (existing) {
      if (existing.role !== seedUser.role) {
        await db
          .update(user)
          .set({ role: seedUser.role, updatedAt: new Date() })
          .where(eq(user.id, existing.id));
      }

      continue;
    }

    const passwordHash = await hashPassword(DEMO_USER_PASSWORD);
    const now = new Date();

    await db.insert(user).values({
      id: seedUser.id,
      name: seedUser.name,
      email: seedUser.email,
      emailVerified: true,
      role: seedUser.role,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(account).values({
      id: `seed-account-${seedUser.id}`,
      accountId: seedUser.id,
      providerId: "credential",
      userId: seedUser.id,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  }
}

async function main(): Promise<void> {
  await seedClientsTable();
  await seedContactsTable();
  await seedPrimaryContacts();
  await seedProjectsTable();
  await seedTasksTable();
  await seedAuthUsers();

  const [clientTotals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      withPrimaryContact: sql<number>`count(primary_contact_id)::int`,
    })
    .from(clients);
  const [contactTotals] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(contacts);
  const [projectTotals] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(projects);
  const [taskTotals] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(tasks);
  const [userTotals] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(user);
  const [credentialTotals] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(account)
    .where(eq(account.providerId, "credential"));
  const roleRows = await db
    .select({ email: user.email, role: user.role })
    .from(user);

  console.log(
    `Seed complete. clients=${clientTotals?.total ?? 0} ` +
      `(with primary contact: ${clientTotals?.withPrimaryContact ?? 0}), ` +
      `contacts=${contactTotals?.total ?? 0}, ` +
      `projects=${projectTotals?.total ?? 0}, ` +
      `tasks=${taskTotals?.total ?? 0}, ` +
      `users=${userTotals?.total ?? 0} ` +
      `(credential accounts: ${credentialTotals?.total ?? 0}).`,
  );
  console.log(
    `Roles: ${roleRows.map((row) => `${row.email}=${row.role}`).join(", ")}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
