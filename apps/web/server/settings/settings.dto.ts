import type { UserSettingsRow } from "../db/schema";
import { DEFAULT_USER_SETTINGS } from "./settings.defaults";

export type UserSettingsDTO = {
  defaultAssignee: "Mari" | "Chris" | "Alex" | null;
  defaultEnvironment:
    | "Development"
    | "QA"
    | "Staging"
    | "Production"
    | "Demo"
    | null;
};

function asDefaultAssignee(
  value: string | null,
): UserSettingsDTO["defaultAssignee"] {
  if (value === "Mari" || value === "Chris" || value === "Alex") {
    return value;
  }

  return null;
}

function asDefaultEnvironment(
  value: string | null,
): UserSettingsDTO["defaultEnvironment"] {
  if (
    value === "Development" ||
    value === "QA" ||
    value === "Staging" ||
    value === "Production" ||
    value === "Demo"
  ) {
    return value;
  }

  return null;
}

export function toUserSettingsDTO(
  row: UserSettingsRow | null,
): UserSettingsDTO {
  if (!row) {
    return {
      defaultAssignee: DEFAULT_USER_SETTINGS.defaultAssignee,
      defaultEnvironment: DEFAULT_USER_SETTINGS.defaultEnvironment,
    };
  }

  return {
    defaultAssignee: asDefaultAssignee(row.defaultAssignee),
    defaultEnvironment: asDefaultEnvironment(row.defaultEnvironment),
  };
}
