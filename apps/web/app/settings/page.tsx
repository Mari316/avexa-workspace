"use client";

import { FormEvent, useEffect, useState } from "react";

import { useAppData } from "../../context/AppDataContext";

import styles from "./page.module.css";

type SettingsSection =
  | "general"
  | "notifications"
  | "test-configuration"
  | "integrations";

type GeneralSettings = {
  workspaceName: string;
  defaultAssignee: string;
  defaultEnvironment: string;
  timezone: string;
};

type NotificationSettings = {
  taskAssigned: boolean;
  taskStatusChanged: boolean;
  taskApproachingDueDate: boolean;
  newCommentOrNote: boolean;
  projectStatusChanged: boolean;
  failedTestNotification: boolean;
};

type TestConfiguration = {
  defaultTestType: string;
  defaultBrowser: string;
  defaultRetryCount: string;
  parallelWorkers: string;
  captureScreenshotOnFailure: boolean;
  recordVideoOnFailure: boolean;
};

type Integration = {
  id: string;
  name: string;
  description: string;
  connected: boolean;
};

const sectionLabels: Record<SettingsSection, string> = {
  general: "General",
  notifications: "Notifications",
  "test-configuration": "Test Configuration",
  integrations: "Integrations",
};

const assigneeOptions = [
  "Mari Astapova",
  "Chris Miller",
  "Alex Brown",
  "Sofia Chen",
];

const environmentOptions = ["Development", "QA", "Staging", "Production"];

const timezoneOptions = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
];

const testTypeOptions = ["E2E", "API", "Integration", "Component"];
const browserOptions = ["Chromium", "Firefox", "WebKit"];
const retryCountOptions = ["0", "1", "2", "3"];
const parallelWorkerOptions = ["1", "2", "4", "8"];

const initialGeneralSettings: GeneralSettings = {
  workspaceName: "Avexa Workspace",
  defaultAssignee: "Mari Astapova",
  defaultEnvironment: "Staging",
  timezone: "America/New_York",
};

const initialNotificationSettings: NotificationSettings = {
  taskAssigned: true,
  taskStatusChanged: true,
  taskApproachingDueDate: true,
  newCommentOrNote: true,
  projectStatusChanged: false,
  failedTestNotification: true,
};

const initialTestConfiguration: TestConfiguration = {
  defaultTestType: "E2E",
  defaultBrowser: "Chromium",
  defaultRetryCount: "1",
  parallelWorkers: "4",
  captureScreenshotOnFailure: true,
  recordVideoOnFailure: false,
};

const initialIntegrations: Integration[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Connect repositories for automation and pull request workflows.",
    connected: true,
  },
  {
    id: "testrail",
    name: "TestRail",
    description: "Sync test cases and regression results with TestRail.",
    connected: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send QA alerts and workspace notifications to Slack channels.",
    connected: true,
  },
  {
    id: "jira",
    name: "Jira",
    description: "Link tasks, bugs, and project updates with Jira issues.",
    connected: false,
  },
];

function settingsEqual<T>(current: T, saved: T): boolean {
  return JSON.stringify(current) === JSON.stringify(saved);
}

export default function SettingsPage() {
  const { resetDemoData } = useAppData();
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("general");
  const [successMessage, setSuccessMessage] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [generalSettings, setGeneralSettings] =
    useState<GeneralSettings>(initialGeneralSettings);
  const [savedGeneralSettings, setSavedGeneralSettings] =
    useState<GeneralSettings>(initialGeneralSettings);
  const [generalError, setGeneralError] = useState("");

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(initialNotificationSettings);
  const [savedNotificationSettings, setSavedNotificationSettings] =
    useState<NotificationSettings>(initialNotificationSettings);

  const [testConfiguration, setTestConfiguration] = useState<TestConfiguration>(
    initialTestConfiguration,
  );
  const [savedTestConfiguration, setSavedTestConfiguration] =
    useState<TestConfiguration>(initialTestConfiguration);

  const [integrations, setIntegrations] =
    useState<Integration[]>(initialIntegrations);

  const isGeneralDirty = !settingsEqual(generalSettings, savedGeneralSettings);
  const isNotificationsDirty = !settingsEqual(
    notificationSettings,
    savedNotificationSettings,
  );
  const isTestConfigDirty = !settingsEqual(
    testConfiguration,
    savedTestConfiguration,
  );

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  function handleSaveGeneral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!generalSettings.workspaceName.trim()) {
      setGeneralError("Workspace name is required.");
      return;
    }

    setGeneralError("");
    setSavedGeneralSettings(generalSettings);
    setSuccessMessage("Settings saved successfully");
  }

  function handleSaveNotifications(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedNotificationSettings(notificationSettings);
    setSuccessMessage("Notification preferences saved");
  }

  function handleSaveTestConfiguration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedTestConfiguration(testConfiguration);
    setSuccessMessage("Test configuration saved");
  }

  function toggleIntegration(integrationId: string) {
    setIntegrations((currentIntegrations) =>
      currentIntegrations.map((integration) => {
        if (integration.id !== integrationId) {
          return integration;
        }

        const connected = !integration.connected;
        setSuccessMessage(
          connected
            ? `${integration.name} connected successfully`
            : `${integration.name} disconnected successfully`,
        );

        return {
          ...integration,
          connected,
        };
      }),
    );
  }

  function handleConfirmReset() {
    resetDemoData();
    setIsResetModalOpen(false);
    setSuccessMessage("Demo data reset successfully");
  }

  return (
    <main className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>
            Manage your workspace preferences and QA configuration.
          </p>
        </div>

        {successMessage && (
          <div className={styles.successBanner} role="status">
            {successMessage}
          </div>
        )}

        <div className={styles.settingsLayout}>
          <nav className={styles.nav} aria-label="Settings sections">
            {(Object.keys(sectionLabels) as SettingsSection[]).map(
              (section) => (
                <button
                  key={section}
                  type="button"
                  className={`${styles.navButton} ${
                    activeSection === section ? styles.navButtonActive : ""
                  }`}
                  onClick={() => setActiveSection(section)}
                  aria-current={activeSection === section ? "page" : undefined}
                >
                  {sectionLabels[section]}
                </button>
              ),
            )}
          </nav>

          <div className={styles.content}>
            {activeSection === "general" && (
              <section className={styles.card} aria-labelledby="general-title">
                <h2 id="general-title" className={styles.cardTitle}>
                  Workspace Settings
                </h2>

                <form className={styles.form} onSubmit={handleSaveGeneral}>
                  <div className={styles.field}>
                    <label htmlFor="workspace-name" className={styles.label}>
                      Workspace Name *
                    </label>
                    <input
                      id="workspace-name"
                      type="text"
                      className={styles.input}
                      value={generalSettings.workspaceName}
                      onChange={(event) =>
                        setGeneralSettings((currentSettings) => ({
                          ...currentSettings,
                          workspaceName: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(generalError)}
                      aria-describedby={
                        generalError ? "workspace-name-error" : undefined
                      }
                    />
                    {generalError && (
                      <p id="workspace-name-error" className={styles.error}>
                        {generalError}
                      </p>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="default-assignee" className={styles.label}>
                      Default Assignee
                    </label>
                    <select
                      id="default-assignee"
                      className={styles.select}
                      value={generalSettings.defaultAssignee}
                      onChange={(event) =>
                        setGeneralSettings((currentSettings) => ({
                          ...currentSettings,
                          defaultAssignee: event.target.value,
                        }))
                      }
                    >
                      {assigneeOptions.map((assignee) => (
                        <option key={assignee} value={assignee}>
                          {assignee}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label
                      htmlFor="default-environment"
                      className={styles.label}
                    >
                      Default Environment
                    </label>
                    <select
                      id="default-environment"
                      className={styles.select}
                      value={generalSettings.defaultEnvironment}
                      onChange={(event) =>
                        setGeneralSettings((currentSettings) => ({
                          ...currentSettings,
                          defaultEnvironment: event.target.value,
                        }))
                      }
                    >
                      {environmentOptions.map((environment) => (
                        <option key={environment} value={environment}>
                          {environment}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="timezone" className={styles.label}>
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      className={styles.select}
                      value={generalSettings.timezone}
                      onChange={(event) =>
                        setGeneralSettings((currentSettings) => ({
                          ...currentSettings,
                          timezone: event.target.value,
                        }))
                      }
                    >
                      {timezoneOptions.map((timezone) => (
                        <option key={timezone} value={timezone}>
                          {timezone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      type="submit"
                      className={styles.saveButton}
                      disabled={!isGeneralDirty}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>

                <div className={styles.resetSection}>
                  <h3 className={styles.resetTitle}>Demo Data</h3>
                  <p className={styles.resetDescription}>
                    Restore projects, tasks, and contacts to the original demo
                    seed data. Clients are stored in the database and are not
                    affected.
                  </p>
                  <button
                    type="button"
                    className={styles.resetButton}
                    aria-label="Reset Demo Data"
                    onClick={() => setIsResetModalOpen(true)}
                  >
                    Reset Demo Data
                  </button>
                </div>
              </section>
            )}

            {activeSection === "notifications" && (
              <section
                className={styles.card}
                aria-labelledby="notifications-title"
              >
                <h2 id="notifications-title" className={styles.cardTitle}>
                  Notification Preferences
                </h2>

                <form className={styles.form} onSubmit={handleSaveNotifications}>
                  <div className={styles.checkboxList}>
                    <div className={styles.checkboxField}>
                      <input
                        id="notify-task-assigned"
                        type="checkbox"
                        className={styles.checkbox}
                        checked={notificationSettings.taskAssigned}
                        onChange={(event) =>
                          setNotificationSettings((currentSettings) => ({
                            ...currentSettings,
                            taskAssigned: event.target.checked,
                          }))
                        }
                      />
                      <label
                        htmlFor="notify-task-assigned"
                        className={styles.checkboxLabel}
                      >
                        Task assigned to me
                      </label>
                    </div>

                    <div className={styles.checkboxField}>
                      <input
                        id="notify-task-status-changed"
                        type="checkbox"
                        className={styles.checkbox}
                        checked={notificationSettings.taskStatusChanged}
                        onChange={(event) =>
                          setNotificationSettings((currentSettings) => ({
                            ...currentSettings,
                            taskStatusChanged: event.target.checked,
                          }))
                        }
                      />
                      <label
                        htmlFor="notify-task-status-changed"
                        className={styles.checkboxLabel}
                      >
                        Task status changed
                      </label>
                    </div>

                    <div className={styles.checkboxField}>
                      <input
                        id="notify-task-due-date"
                        type="checkbox"
                        className={styles.checkbox}
                        checked={notificationSettings.taskApproachingDueDate}
                        onChange={(event) =>
                          setNotificationSettings((currentSettings) => ({
                            ...currentSettings,
                            taskApproachingDueDate: event.target.checked,
                          }))
                        }
                      />
                      <label
                        htmlFor="notify-task-due-date"
                        className={styles.checkboxLabel}
                      >
                        Task approaching due date
                      </label>
                    </div>

                    <div className={styles.checkboxField}>
                      <input
                        id="notify-new-comment"
                        type="checkbox"
                        className={styles.checkbox}
                        checked={notificationSettings.newCommentOrNote}
                        onChange={(event) =>
                          setNotificationSettings((currentSettings) => ({
                            ...currentSettings,
                            newCommentOrNote: event.target.checked,
                          }))
                        }
                      />
                      <label
                        htmlFor="notify-new-comment"
                        className={styles.checkboxLabel}
                      >
                        New comment or note
                      </label>
                    </div>

                    <div className={styles.checkboxField}>
                      <input
                        id="notify-project-status"
                        type="checkbox"
                        className={styles.checkbox}
                        checked={notificationSettings.projectStatusChanged}
                        onChange={(event) =>
                          setNotificationSettings((currentSettings) => ({
                            ...currentSettings,
                            projectStatusChanged: event.target.checked,
                          }))
                        }
                      />
                      <label
                        htmlFor="notify-project-status"
                        className={styles.checkboxLabel}
                      >
                        Project status changed
                      </label>
                    </div>

                    <div className={styles.checkboxField}>
                      <input
                        id="notify-failed-test"
                        type="checkbox"
                        className={styles.checkbox}
                        checked={notificationSettings.failedTestNotification}
                        onChange={(event) =>
                          setNotificationSettings((currentSettings) => ({
                            ...currentSettings,
                            failedTestNotification: event.target.checked,
                          }))
                        }
                      />
                      <label
                        htmlFor="notify-failed-test"
                        className={styles.checkboxLabel}
                      >
                        Failed test notification
                      </label>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      type="submit"
                      className={styles.saveButton}
                      disabled={!isNotificationsDirty}
                    >
                      Save Preferences
                    </button>
                  </div>
                </form>
              </section>
            )}

            {activeSection === "test-configuration" && (
              <section className={styles.card} aria-labelledby="test-config-title">
                <h2 id="test-config-title" className={styles.cardTitle}>
                  Test Configuration
                </h2>

                <form
                  className={styles.form}
                  onSubmit={handleSaveTestConfiguration}
                >
                  <div className={styles.field}>
                    <label htmlFor="default-test-type" className={styles.label}>
                      Default Test Type
                    </label>
                    <select
                      id="default-test-type"
                      className={styles.select}
                      value={testConfiguration.defaultTestType}
                      onChange={(event) =>
                        setTestConfiguration((currentConfig) => ({
                          ...currentConfig,
                          defaultTestType: event.target.value,
                        }))
                      }
                    >
                      {testTypeOptions.map((testType) => (
                        <option key={testType} value={testType}>
                          {testType}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="default-browser" className={styles.label}>
                      Default Browser
                    </label>
                    <select
                      id="default-browser"
                      className={styles.select}
                      value={testConfiguration.defaultBrowser}
                      onChange={(event) =>
                        setTestConfiguration((currentConfig) => ({
                          ...currentConfig,
                          defaultBrowser: event.target.value,
                        }))
                      }
                    >
                      {browserOptions.map((browser) => (
                        <option key={browser} value={browser}>
                          {browser}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="default-retry-count" className={styles.label}>
                      Default Retry Count
                    </label>
                    <select
                      id="default-retry-count"
                      className={styles.select}
                      value={testConfiguration.defaultRetryCount}
                      onChange={(event) =>
                        setTestConfiguration((currentConfig) => ({
                          ...currentConfig,
                          defaultRetryCount: event.target.value,
                        }))
                      }
                    >
                      {retryCountOptions.map((retryCount) => (
                        <option key={retryCount} value={retryCount}>
                          {retryCount}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="parallel-workers" className={styles.label}>
                      Parallel Workers
                    </label>
                    <select
                      id="parallel-workers"
                      className={styles.select}
                      value={testConfiguration.parallelWorkers}
                      onChange={(event) =>
                        setTestConfiguration((currentConfig) => ({
                          ...currentConfig,
                          parallelWorkers: event.target.value,
                        }))
                      }
                    >
                      {parallelWorkerOptions.map((workers) => (
                        <option key={workers} value={workers}>
                          {workers}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.checkboxList}>
                    <div className={styles.checkboxField}>
                      <input
                        id="capture-screenshot"
                        type="checkbox"
                        className={styles.checkbox}
                        checked={testConfiguration.captureScreenshotOnFailure}
                        onChange={(event) =>
                          setTestConfiguration((currentConfig) => ({
                            ...currentConfig,
                            captureScreenshotOnFailure: event.target.checked,
                          }))
                        }
                      />
                      <label
                        htmlFor="capture-screenshot"
                        className={styles.checkboxLabel}
                      >
                        Capture screenshot on failure
                      </label>
                    </div>

                    <div className={styles.checkboxField}>
                      <input
                        id="record-video"
                        type="checkbox"
                        className={styles.checkbox}
                        checked={testConfiguration.recordVideoOnFailure}
                        onChange={(event) =>
                          setTestConfiguration((currentConfig) => ({
                            ...currentConfig,
                            recordVideoOnFailure: event.target.checked,
                          }))
                        }
                      />
                      <label
                        htmlFor="record-video"
                        className={styles.checkboxLabel}
                      >
                        Record video on failure
                      </label>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      type="submit"
                      className={styles.saveButton}
                      disabled={!isTestConfigDirty}
                    >
                      Save Test Configuration
                    </button>
                  </div>
                </form>
              </section>
            )}

            {activeSection === "integrations" && (
              <section
                className={styles.card}
                aria-labelledby="integrations-title"
              >
                <h2 id="integrations-title" className={styles.cardTitle}>
                  Integrations
                </h2>

                <div className={styles.integrationList}>
                  {integrations.map((integration) => (
                    <div key={integration.id} className={styles.integrationRow}>
                      <div className={styles.integrationInfo}>
                        <h3 className={styles.integrationName}>
                          {integration.name}
                        </h3>
                        <p className={styles.integrationDescription}>
                          {integration.description}
                        </p>
                      </div>

                      <div className={styles.integrationActions}>
                        <span
                          className={`${styles.badge} ${
                            integration.connected
                              ? styles.badgeConnected
                              : styles.badgeNotConnected
                          }`}
                        >
                          {integration.connected
                            ? "Connected"
                            : "Not Connected"}
                        </span>
                        <button
                          type="button"
                          className={`${styles.integrationButton} ${
                            integration.connected
                              ? styles.integrationButtonDanger
                              : ""
                          }`}
                          onClick={() => toggleIntegration(integration.id)}
                        >
                          {integration.connected ? "Disconnect" : "Connect"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {isResetModalOpen && (
          <div
            className={styles.backdrop}
            role="presentation"
            onClick={() => setIsResetModalOpen(false)}
          >
            <div
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="reset-demo-data-title"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="reset-demo-data-title" className={styles.modalTitle}>
                Reset Demo Data
              </h2>
              <p className={styles.modalMessage}>
                Reset all Avexa demo data to its original state? All changes
                made in this browser will be lost.
              </p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsResetModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.confirmResetButton}
                  aria-label="Reset Data"
                  onClick={handleConfirmReset}
                >
                  Reset Data
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
  );
}
