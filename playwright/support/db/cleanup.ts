import { Client } from "pg";

import { assertTestDatabase } from "./assert-test-database";

export type CleanupTestDataInput = {
  /** Exact client UUIDs to remove (with dependent graph). */
  clientIds?: string[];
  /** Exact client slugs to remove (with dependent graph). */
  clientSlugs?: string[];
  /** Exact project UUIDs (and their tasks). */
  projectIds?: string[];
  projectSlugs?: string[];
  /** Exact task UUIDs / slugs. */
  taskIds?: string[];
  taskSlugs?: string[];
  /** Exact contact UUIDs / slugs (clears primary_contact_id first). */
  contactIds?: string[];
  contactSlugs?: string[];
};

async function withTestClient<T>(
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  assertTestDatabase();

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Deletes exactly the owned test records (and dependents) from avexa_test.
 * Idempotent: missing rows are fine. Does not delete seed rows unless listed.
 */
export async function cleanupTestData(
  input: CleanupTestDataInput,
): Promise<void> {
  await withTestClient(async (client) => {
    const clientIds = new Set(input.clientIds ?? []);
    const projectIds = new Set(input.projectIds ?? []);
    const taskIds = new Set(input.taskIds ?? []);
    const contactIds = new Set(input.contactIds ?? []);

    if (input.clientSlugs?.length) {
      const result = await client.query<{ id: string }>(
        `SELECT id FROM clients WHERE slug = ANY($1::text[])`,
        [input.clientSlugs],
      );
      for (const row of result.rows) {
        clientIds.add(row.id);
      }
    }

    if (input.projectSlugs?.length) {
      const result = await client.query<{ id: string }>(
        `SELECT id FROM projects WHERE slug = ANY($1::text[])`,
        [input.projectSlugs],
      );
      for (const row of result.rows) {
        projectIds.add(row.id);
      }
    }

    if (input.taskSlugs?.length) {
      const result = await client.query<{ id: string }>(
        `SELECT id FROM tasks WHERE slug = ANY($1::text[])`,
        [input.taskSlugs],
      );
      for (const row of result.rows) {
        taskIds.add(row.id);
      }
    }

    if (input.contactSlugs?.length) {
      const result = await client.query<{ id: string }>(
        `SELECT id FROM contacts WHERE slug = ANY($1::text[])`,
        [input.contactSlugs],
      );
      for (const row of result.rows) {
        contactIds.add(row.id);
      }
    }

    // Expand client → projects/contacts so a client cleanup removes the graph.
    if (clientIds.size > 0) {
      const clientIdList = [...clientIds];
      const projects = await client.query<{ id: string }>(
        `SELECT id FROM projects WHERE client_id = ANY($1::uuid[])`,
        [clientIdList],
      );
      for (const row of projects.rows) {
        projectIds.add(row.id);
      }

      const contacts = await client.query<{ id: string }>(
        `SELECT id FROM contacts WHERE client_id = ANY($1::uuid[])`,
        [clientIdList],
      );
      for (const row of contacts.rows) {
        contactIds.add(row.id);
      }
    }

    if (projectIds.size > 0) {
      const projectIdList = [...projectIds];
      const tasks = await client.query<{ id: string }>(
        `SELECT id FROM tasks WHERE project_id = ANY($1::uuid[])`,
        [projectIdList],
      );
      for (const row of tasks.rows) {
        taskIds.add(row.id);
      }
    }

    if (taskIds.size > 0) {
      await client.query(`DELETE FROM tasks WHERE id = ANY($1::uuid[])`, [
        [...taskIds],
      ]);
    }

    if (projectIds.size > 0) {
      await client.query(`DELETE FROM projects WHERE id = ANY($1::uuid[])`, [
        [...projectIds],
      ]);
    }

    if (contactIds.size > 0 || clientIds.size > 0) {
      await client.query(
        `UPDATE clients
         SET primary_contact_id = NULL
         WHERE id = ANY($1::uuid[])
            OR primary_contact_id = ANY($2::uuid[])`,
        [[...clientIds], [...contactIds]],
      );
    }

    if (contactIds.size > 0) {
      await client.query(`DELETE FROM contacts WHERE id = ANY($1::uuid[])`, [
        [...contactIds],
      ]);
    }

    if (clientIds.size > 0) {
      await client.query(`DELETE FROM clients WHERE id = ANY($1::uuid[])`, [
        [...clientIds],
      ]);
    }
  });
}
