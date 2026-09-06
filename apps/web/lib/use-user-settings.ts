"use client";

import { useEffect, useState } from "react";

import { getSettings, type UserSettingsDTO } from "./api/settings";

export type UserSettingsState = {
  settings: UserSettingsDTO | null;
  isLoading: boolean;
};

/**
 * Loads the signed-in user's create-form defaults once per page mount.
 * A failed fetch is treated as no preference so Add Task/Project still work.
 */
export function useUserSettings(): UserSettingsState {
  const [settings, setSettings] = useState<UserSettingsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getSettings()
      .then((data) => {
        if (!cancelled) {
          setSettings(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSettings({
            defaultAssignee: null,
            defaultEnvironment: null,
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, isLoading };
}
