import type { APIRequestContext, APIResponse } from "@playwright/test";

import { isRecord } from "./errors.js";

export type TeamRole = "admin" | "qa_engineer" | "viewer";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  createdAt: string;
};

export class TeamApi {
  constructor(private readonly request: APIRequestContext) {}

  getTeam(): Promise<APIResponse> {
    return this.request.get("/api/v1/team");
  }
}

export async function readTeamRecords(
  response: APIResponse,
): Promise<Record<string, unknown>[]> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !Array.isArray(body.data)) {
    throw new Error("Team response is missing data");
  }

  return body.data.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Team item ${index} is not an object`);
    }

    return item;
  });
}

export async function readTeam(response: APIResponse): Promise<TeamMember[]> {
  const records = await readTeamRecords(response);

  return records.map((record, index) => parseTeamMember(record, index));
}

export function parseTeamMember(
  record: Record<string, unknown>,
  index: number,
): TeamMember {
  const { id, name, email, role, createdAt } = record;

  if (typeof id !== "string" || id.length === 0) {
    throw new Error(`Team item ${index} is missing id`);
  }

  if (typeof name !== "string" || name.length === 0) {
    throw new Error(`Team item ${index} is missing name`);
  }

  if (typeof email !== "string" || email.length === 0) {
    throw new Error(`Team item ${index} is missing email`);
  }

  if (!isTeamRole(role)) {
    throw new Error(`Team item ${index} has an invalid role`);
  }

  if (typeof createdAt !== "string" || createdAt.length === 0) {
    throw new Error(`Team item ${index} is missing createdAt`);
  }

  return { id, name, email, role, createdAt };
}

function isTeamRole(value: unknown): value is TeamRole {
  return value === "admin" || value === "qa_engineer" || value === "viewer";
}
