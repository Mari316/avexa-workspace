import { asc, desc, eq, ne, sql } from "drizzle-orm";

import { db } from "../db";
import { clients, notes, projects, tasks } from "../db/schema";
import type { DashboardDTO, DashboardTaskItem } from "./dashboard.dto";

const taskItemSelection = {
  slug: tasks.slug,
  title: tasks.title,
  projectName: projects.name,
  dueDate: tasks.dueDate,
  status: tasks.status,
  priority: tasks.priority,
};

function asCount(value: number | undefined): number {
  return value ?? 0;
}

function toTaskItem(row: DashboardTaskItem): DashboardTaskItem {
  return {
    slug: row.slug,
    title: row.title,
    projectName: row.projectName,
    dueDate: row.dueDate,
    status: row.status,
    priority: row.priority,
  };
}

export async function getDashboard(): Promise<DashboardDTO> {
  const [clientCounts, projectCounts, taskCounts, noteCounts, recentRows, upcomingRows] =
    await Promise.all([
      db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) filter (where ${clients.status} = 'Active')::int`,
        })
        .from(clients)
        .then((rows) => rows[0]),
      db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) filter (where ${projects.status} = 'Active')::int`,
        })
        .from(projects)
        .then((rows) => rows[0]),
      db
        .select({
          total: sql<number>`count(*)::int`,
          overdue: sql<number>`count(*) filter (where ${tasks.dueDate} < current_date and ${tasks.status} <> 'Done')::int`,
          dueToday: sql<number>`count(*) filter (where ${tasks.dueDate} = current_date and ${tasks.status} <> 'Done')::int`,
          dueSoon: sql<number>`count(*) filter (where ${tasks.dueDate} > current_date and ${tasks.dueDate} <= current_date + 7 and ${tasks.status} <> 'Done')::int`,
        })
        .from(tasks)
        .then((rows) => rows[0]),
      db
        .select({
          total: sql<number>`count(*)::int`,
          pinned: sql<number>`count(*) filter (where ${notes.pinned} = true)::int`,
        })
        .from(notes)
        .then((rows) => rows[0]),
      db
        .select(taskItemSelection)
        .from(tasks)
        .innerJoin(projects, eq(tasks.projectId, projects.id))
        .orderBy(desc(tasks.updatedAt), asc(tasks.slug))
        .limit(5),
      db
        .select(taskItemSelection)
        .from(tasks)
        .innerJoin(projects, eq(tasks.projectId, projects.id))
        .where(ne(tasks.status, "Done"))
        .orderBy(asc(tasks.dueDate), asc(tasks.slug))
        .limit(5),
    ]);

  return {
    totals: {
      clients: asCount(clientCounts?.total),
      activeClients: asCount(clientCounts?.active),
      projects: asCount(projectCounts?.total),
      activeProjects: asCount(projectCounts?.active),
      tasks: asCount(taskCounts?.total),
      overdueTasks: asCount(taskCounts?.overdue),
      dueTodayTasks: asCount(taskCounts?.dueToday),
      dueSoonTasks: asCount(taskCounts?.dueSoon),
      notes: asCount(noteCounts?.total),
      pinnedNotes: asCount(noteCounts?.pinned),
    },
    recentTasks: recentRows.map(toTaskItem),
    upcomingDueTasks: upcomingRows.map(toTaskItem),
  };
}
