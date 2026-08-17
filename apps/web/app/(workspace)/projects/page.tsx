"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useAppData } from "../../../context/AppDataContext";
import { ApiError } from "../../../lib/api/request";
import { type ProjectStatus } from "../../../lib/mockData";

import styles from "./page.module.css";

type ProjectEnvironment =
  | "Development"
  | "QA"
  | "Staging"
  | "Production"
  | "Demo";

type ProjectFormData = {
  name: string;
  clientId: string;
  environment: string;
  status: ProjectStatus;
};

type FormErrors = {
  name?: string;
  clientId?: string;
  environment?: string;
};

const environmentOptions: ProjectEnvironment[] = [
  "Development",
  "QA",
  "Staging",
  "Production",
  "Demo",
];

const emptyForm: ProjectFormData = {
  name: "",
  clientId: "",
  environment: "",
  status: "Active",
};

function validateForm(form: ProjectFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Project name is required.";
  }

  if (!form.clientId) {
    errors.clientId = "Client is required.";
  }

  if (!form.environment) {
    errors.environment = "Environment is required.";
  }

  return errors;
}

function toFormErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "PROJECT_SLUG_CONFLICT":
        return "A project with this name already exists.";
      case "PROJECT_NAME_NOT_SLUGGABLE":
        return "Enter a project name containing letters or numbers.";
      case "CLIENT_NOT_FOUND":
        return "The selected client does not exist.";
      case "VALIDATION_ERROR":
        return "Please check the values you entered and try again.";
      case "NETWORK_ERROR":
        return "Unable to reach the server. Please try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  return "Something went wrong. Please try again.";
}

export default function ProjectsPage() {
  const {
    clients,
    projects,
    tasks,
    isLoadingProjects,
    projectsError,
    addProject,
  } = useAppData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ProjectFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openModal() {
    setForm(emptyForm);
    setErrors({});
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    setFormError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      await addProject({
        name: form.name.trim(),
        clientId: form.clientId,
        environment: form.environment as ProjectEnvironment,
        status: form.status,
      });
      setIsModalOpen(false);
      setForm(emptyForm);
      setErrors({});
      setFormError("");
    } catch (error) {
      setFormError(toFormErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <main className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Projects</h1>
            <p className={styles.subtitle}>
              Manage QA automation projects across client organizations.
            </p>
          </div>

          <button
            type="button"
            className={styles.addButton}
            onClick={openModal}
          >
            + Add Project
          </button>
        </div>

        {projectsError ? (
          <p className={styles.error} role="alert">
            {projectsError}
          </p>
        ) : null}

        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Environment</th>
                <th>Tasks</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingProjects ? (
                <tr>
                  <td colSpan={6} className={styles.secondaryText}>
                    Loading projects…
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id}>
                    <td className={styles.projectName}>{project.name}</td>
                    <td className={styles.secondaryText}>{project.clientName}</td>
                    <td className={styles.secondaryText}>{project.environment}</td>
                    <td className={styles.secondaryText}>
                      {
                        tasks.filter((task) => task.projectId === project.id)
                          .length
                      }
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          project.status === "Active"
                            ? styles.badgeActive
                            : styles.badgeOnHold
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/projects/${project.slug}`}
                        className={styles.viewAction}
                        aria-label={`View ${project.name}`}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {isModalOpen && (
        <div className={styles.backdrop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-project-title"
            className={styles.modal}
          >
            <h2 id="add-project-title" className={styles.modalTitle}>
              Add Project
            </h2>

            <form className={styles.form} onSubmit={handleSubmit}>
              {formError ? (
                <p className={styles.error} role="alert">
                  {formError}
                </p>
              ) : null}

              <div className={styles.field}>
                <label htmlFor="project-name" className={styles.label}>
                  Project Name *
                </label>
                <input
                  id="project-name"
                  type="text"
                  className={styles.input}
                  value={form.name}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      name: event.target.value,
                    }))
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "project-name-error" : undefined
                  }
                />
                {errors.name && (
                  <p id="project-name-error" className={styles.error}>
                    {errors.name}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="project-client" className={styles.label}>
                  Client *
                </label>
                <select
                  id="project-client"
                  className={styles.select}
                  value={form.clientId}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      clientId: event.target.value,
                    }))
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.clientId)}
                  aria-describedby={
                    errors.clientId ? "project-client-error" : undefined
                  }
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p id="project-client-error" className={styles.error}>
                    {errors.clientId}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="project-environment" className={styles.label}>
                  Environment *
                </label>
                <select
                  id="project-environment"
                  className={styles.select}
                  value={form.environment}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      environment: event.target.value,
                    }))
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.environment)}
                  aria-describedby={
                    errors.environment ? "project-environment-error" : undefined
                  }
                >
                  <option value="">Select an environment</option>
                  {environmentOptions.map((environment) => (
                    <option key={environment} value={environment}>
                      {environment}
                    </option>
                  ))}
                </select>
                {errors.environment && (
                  <p id="project-environment-error" className={styles.error}>
                    {errors.environment}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="project-status" className={styles.label}>
                  Status *
                </label>
                <select
                  id="project-status"
                  className={styles.select}
                  value={form.status}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      status: event.target.value as ProjectStatus,
                    }))
                  }
                  disabled={isSaving}
                >
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving…" : "Add Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
