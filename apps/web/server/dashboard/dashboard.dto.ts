import type { TaskRow } from "../db/schema";

export type DashboardTaskItem = {
  slug: string;
  title: string;
  projectName: string;
  /** ISO calendar date `YYYY-MM-DD`. */
  dueDate: string;
  status: TaskRow["status"];
  priority: TaskRow["priority"];
};

export type DashboardDTO = {
  totals: {
    clients: number;
    activeClients: number;
    projects: number;
    activeProjects: number;
    tasks: number;
    overdueTasks: number;
    dueTodayTasks: number;
    dueSoonTasks: number;
    notes: number;
    pinnedNotes: number;
  };
  recentTasks: DashboardTaskItem[];
  upcomingDueTasks: DashboardTaskItem[];
};
