import type { UserSettingsDTO } from "../../server/settings/settings.dto";
import { request } from "./request";

export type { UserSettingsDTO };

export type UpdateSettingsBody = {
  defaultAssignee?: UserSettingsDTO["defaultAssignee"];
  defaultEnvironment?: UserSettingsDTO["defaultEnvironment"];
};

const SETTINGS_URL = "/api/v1/settings";

export function getSettings(): Promise<UserSettingsDTO> {
  return request<UserSettingsDTO>(SETTINGS_URL);
}

export function updateSettings(
  patch: UpdateSettingsBody,
): Promise<UserSettingsDTO> {
  return request<UserSettingsDTO>(SETTINGS_URL, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
