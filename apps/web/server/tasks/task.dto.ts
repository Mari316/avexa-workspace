import type { TaskRow } from "../db/schema";

/**
 * Project and Client are denormalized through the Project→Client join. Client is
 * never stored on the task row; changing a project's client updates every task
 * DTO that belongs to that project without rewriting task rows.
 */
export type TaskDTO = {
  id: string;
  slug: string;
  title: string;
  projectId: string;
  projectSlug: string;
  projectName: string;
  clientId: string;
  clientSlug: string;
  clientName: string;
  assignee: string;
  /** ISO calendar date `YYYY-MM-DD`. */
  dueDate: string;
  priority: TaskRow["priority"];
  status: TaskRow["status"];
  createdAt: string;
  updatedAt: string;
};

export type TaskWithRelationsRow = TaskRow & {
  projectSlug: string;
  projectName: string;
  clientId: string;
  clientSlug: string;
  clientName: string;
};

export function toTaskDTO(row: TaskWithRelationsRow): TaskDTO {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    projectId: row.projectId,
    projectSlug: row.projectSlug,
    projectName: row.projectName,
    clientId: row.clientId,
    clientSlug: row.clientSlug,
    clientName: row.clientName,
    assignee: row.assignee,
    dueDate: row.dueDate,
    priority: row.priority,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
