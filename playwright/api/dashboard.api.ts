import type { APIRequestContext, APIResponse } from "@playwright/test";

import { isRecord } from "./errors.js";

export type DashboardTotals = {
  clients: number;
  projects: number;
  tasks: number;
  notes: number;
  overdueTasks: number;
};

export type DashboardTaskItem = {
  title: string;
};

export type DashboardData = {
  totals: DashboardTotals;
  recentTasks: DashboardTaskItem[];
  upcomingDueTasks: DashboardTaskItem[];
};

export class DashboardApi {
  constructor(private readonly request: APIRequestContext) {}

  getDashboard(): Promise<APIResponse> {
    return this.request.get("/api/v1/dashboard");
  }
}

export async function readDashboard(
  response: APIResponse,
): Promise<DashboardData> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Dashboard response is missing data");
  }

  if (!isRecord(body.data.totals)) {
    throw new Error("Dashboard response is missing data.totals");
  }

  return {
    totals: parseTotals(body.data.totals),
    recentTasks: parseTaskItems(body.data.recentTasks, "recentTasks"),
    upcomingDueTasks: parseTaskItems(
      body.data.upcomingDueTasks,
      "upcomingDueTasks",
    ),
  };
}

function parseTotals(totals: Record<string, unknown>): DashboardTotals {
  return {
    clients: requireNumber(totals.clients, "totals.clients"),
    projects: requireNumber(totals.projects, "totals.projects"),
    tasks: requireNumber(totals.tasks, "totals.tasks"),
    notes: requireNumber(totals.notes, "totals.notes"),
    overdueTasks: requireNumber(totals.overdueTasks, "totals.overdueTasks"),
  };
}

function parseTaskItems(
  value: unknown,
  field: string,
): DashboardTaskItem[] {
  if (!Array.isArray(value)) {
    throw new Error(`Dashboard response is missing data.${field}`);
  }

  return value.map((item, index) => {
    if (!isRecord(item) || typeof item.title !== "string") {
      throw new Error(`Dashboard ${field} item ${index} is missing title`);
    }

    return { title: item.title };
  });
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Dashboard response has an invalid ${field}`);
  }

  return value;
}
