import type { APIRequestContext, APIResponse } from "@playwright/test";

import { isRecord } from "./errors.js";

export type SettingsAssignee = "Mari" | "Chris" | "Alex";

export type SettingsEnvironment =
  | "Development"
  | "QA"
  | "Staging"
  | "Production"
  | "Demo";

export type SettingsData = {
  defaultAssignee: SettingsAssignee | null;
  defaultEnvironment: SettingsEnvironment | null;
};

export type SettingsPatch = {
  defaultAssignee?: SettingsAssignee | null;
  defaultEnvironment?: SettingsEnvironment | null;
};

export class SettingsApi {
  constructor(private readonly request: APIRequestContext) {}

  getSettings(): Promise<APIResponse> {
    return this.request.get("/api/v1/settings");
  }

  updateSettings(patch: SettingsPatch): Promise<APIResponse> {
    return this.request.patch("/api/v1/settings", { data: patch });
  }
}

export async function readSettings(
  response: APIResponse,
): Promise<SettingsData> {
  const body: unknown = await response.json();

  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Settings response is missing data");
  }

  return {
    defaultAssignee: parseAssignee(body.data.defaultAssignee),
    defaultEnvironment: parseEnvironment(body.data.defaultEnvironment),
  };
}

function parseAssignee(value: unknown): SettingsAssignee | null {
  if (value === null) {
    return null;
  }

  if (value === "Mari" || value === "Chris" || value === "Alex") {
    return value;
  }

  throw new Error("Settings response has an invalid data.defaultAssignee");
}

function parseEnvironment(value: unknown): SettingsEnvironment | null {
  if (value === null) {
    return null;
  }

  if (
    value === "Development" ||
    value === "QA" ||
    value === "Staging" ||
    value === "Production" ||
    value === "Demo"
  ) {
    return value;
  }

  throw new Error("Settings response has an invalid data.defaultEnvironment");
}
