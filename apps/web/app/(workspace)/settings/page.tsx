"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  getSettings,
  updateSettings,
  type UserSettingsDTO,
} from "../../../lib/api/settings";
import { ApiError } from "../../../lib/api/request";

import styles from "./page.module.css";

const assigneeOptions = ["Mari", "Chris", "Alex"] as const;
const environmentOptions = [
  "Development",
  "QA",
  "Staging",
  "Production",
  "Demo",
] as const;

type SettingsForm = {
  defaultAssignee: string;
  defaultEnvironment: string;
};

function toForm(settings: UserSettingsDTO): SettingsForm {
  return {
    defaultAssignee: settings.defaultAssignee ?? "",
    defaultEnvironment: settings.defaultEnvironment ?? "",
  };
}

function toPatch(form: SettingsForm): UserSettingsDTO {
  return {
    defaultAssignee:
      form.defaultAssignee === ""
        ? null
        : (form.defaultAssignee as UserSettingsDTO["defaultAssignee"]),
    defaultEnvironment:
      form.defaultEnvironment === ""
        ? null
        : (form.defaultEnvironment as UserSettingsDTO["defaultEnvironment"]),
  };
}

function formsEqual(left: SettingsForm, right: SettingsForm): boolean {
  return (
    left.defaultAssignee === right.defaultAssignee &&
    left.defaultEnvironment === right.defaultEnvironment
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "VALIDATION_ERROR":
        return "Please check the values you entered and try again.";
      case "UNAUTHORIZED":
        return "Sign in to manage your settings.";
      case "NETWORK_ERROR":
        return "Unable to reach the server. Please try again.";
      default:
        return "Unable to save settings. Please try again.";
    }
  }

  return "Unable to save settings. Please try again.";
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState<SettingsForm>({
    defaultAssignee: "",
    defaultEnvironment: "",
  });
  const [savedForm, setSavedForm] = useState<SettingsForm>({
    defaultAssignee: "",
    defaultEnvironment: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isDirty = !formsEqual(form, savedForm);

  useEffect(() => {
    let cancelled = false;

    getSettings()
      .then((data) => {
        if (cancelled) {
          return;
        }

        const next = toForm(data);
        setForm(next);
        setSavedForm(next);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof ApiError && error.code === "NETWORK_ERROR"
              ? "Unable to reach the server. Please try again."
              : "Unable to load settings. Please refresh the page.",
          );
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

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isDirty || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setSuccessMessage("");

    try {
      const saved = await updateSettings(toPatch(form));
      const next = toForm(saved);
      setForm(next);
      setSavedForm(next);
      setSuccessMessage("Settings saved.");
    } catch (error) {
      setSaveError(toErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Personal defaults for new tasks and projects.
        </p>
      </div>

      {isLoading ? (
        <p className={styles.status}>Loading settings…</p>
      ) : loadError ? (
        <p className={styles.loadError} role="alert">
          {loadError}
        </p>
      ) : (
        <>
          {successMessage ? (
            <div className={styles.successBanner} role="status">
              {successMessage}
            </div>
          ) : null}

          {saveError ? (
            <p className={styles.loadError} role="alert">
              {saveError}
            </p>
          ) : null}

          <section className={styles.card} aria-labelledby="preferences-title">
            <h2 id="preferences-title" className={styles.cardTitle}>
              Preferences
            </h2>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="default-assignee" className={styles.label}>
                  Default Assignee
                </label>
                <select
                  id="default-assignee"
                  className={styles.select}
                  value={form.defaultAssignee}
                  disabled={isSaving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      defaultAssignee: event.target.value,
                    }))
                  }
                >
                  <option value="">None</option>
                  {assigneeOptions.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="default-environment" className={styles.label}>
                  Default Environment
                </label>
                <select
                  id="default-environment"
                  className={styles.select}
                  value={form.defaultEnvironment}
                  disabled={isSaving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      defaultEnvironment: event.target.value,
                    }))
                  }
                >
                  <option value="">None</option>
                  {environmentOptions.map((environment) => (
                    <option key={environment} value={environment}>
                      {environment}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.cardActions}>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={!isDirty || isSaving}
                >
                  {isSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </main>
  );
}
