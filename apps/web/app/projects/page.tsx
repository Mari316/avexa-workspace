"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useAppData } from "../../context/AppDataContext";
import {
  getProjectSlug,
  type Project,
  type ProjectStatus,
} from "../../lib/mockData";

import styles from "./page.module.css";

type ProjectEnvironment =
  | "Development"
  | "QA"
  | "Staging"
  | "Production"
  | "Demo";

type ProjectClient = string;
type ProjectFormData = {
  name: string;
  client: string;
  environment: string;
  status: ProjectStatus;
};

type FormErrors = {
  name?: string;
  client?: string;
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
  client: "",
  environment: "",
  status: "Active",
};

function validateForm(form: ProjectFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Project name is required.";
  }

  if (!form.client) {
    errors.client = "Client is required.";
  }

  if (!form.environment) {
    errors.environment = "Environment is required.";
  }

  return errors;
}

export default function ProjectsPage() {
  const { clients, projects, tasks, addProject } = useAppData();
  const clientOptions = clients.map((client) => client.name);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ProjectFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  function openModal() {
    setForm(emptyForm);
    setErrors({});
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setForm(emptyForm);
    setErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const newProject: Project = {
      name: form.name.trim(),
      slug: getProjectSlug(form.name.trim()),
      client: form.client,
      environment: form.environment,
      taskCount: 0,
      status: form.status,
    };

    addProject(newProject);
    closeModal();
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
              {projects.map((project) => (
                <tr key={project.name}>
                  <td className={styles.projectName}>{project.name}</td>
                  <td className={styles.secondaryText}>{project.client}</td>
                  <td className={styles.secondaryText}>{project.environment}</td>
                  <td className={styles.secondaryText}>
                    {
                      tasks.filter((task) => task.project === project.name)
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
              ))}
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
                  value={form.client}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      client: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.client)}
                  aria-describedby={
                    errors.client ? "project-client-error" : undefined
                  }
                >
                  <option value="">Select a client</option>
                  {clientOptions.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>
                {errors.client && (
                  <p id="project-client-error" className={styles.error}>
                    {errors.client}
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
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  Add Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
