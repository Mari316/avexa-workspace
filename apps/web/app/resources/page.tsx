"use client";

import { FormEvent, useState } from "react";

import { useAppData } from "../../context/AppDataContext";

import styles from "./page.module.css";

type ResourceType =
  | "Repository"
  | "API Docs"
  | "Environment"
  | "Test Management"
  | "Documentation"
  | "Other";

type ResourceStatus = "Active" | "Inactive";

type Resource = {
  id: string;
  name: string;
  type: ResourceType;
  client: string;
  project: string;
  url: string;
  status: ResourceStatus;
};

type ResourceFormData = {
  name: string;
  type: string;
  client: string;
  project: string;
  url: string;
  status: ResourceStatus;
};

type FormErrors = {
  name?: string;
  type?: string;
  client?: string;
  project?: string;
  url?: string;
};

const typeOptions: ResourceType[] = [
  "Repository",
  "API Docs",
  "Environment",
  "Test Management",
  "Documentation",
  "Other",
];

const initialResources: Resource[] = [
  {
    id: "resource-1",
    name: "Account Management GitHub Repository",
    type: "Repository",
    client: "Pax8",
    project: "Account Management",
    url: "https://github.com/example/pax8-account-management",
    status: "Active",
  },
  {
    id: "resource-2",
    name: "Partner Portal Swagger API",
    type: "API Docs",
    client: "Pax8",
    project: "Partner Portal",
    url: "https://docs.example.com/partner-portal/swagger",
    status: "Active",
  },
  {
    id: "resource-3",
    name: "OrangeHRM Test Environment",
    type: "Environment",
    client: "OrangeHRM",
    project: "OrangeHRM Automation",
    url: "https://demo.orangehrm.example.com",
    status: "Active",
  },
  {
    id: "resource-4",
    name: "Lemonade Web App",
    type: "Environment",
    client: "Lemonade",
    project: "Lemonade Web",
    url: "https://staging.lemonade.example.com",
    status: "Inactive",
  },
  {
    id: "resource-5",
    name: "Public API Documentation",
    type: "API Docs",
    client: "Pax8",
    project: "Public API",
    url: "https://docs.example.com/pax8/public-api",
    status: "Active",
  },
  {
    id: "resource-6",
    name: "TestRail Regression Suite",
    type: "Test Management",
    client: "Pax8",
    project: "Account Management",
    url: "https://testrail.example.com/pax8/regression",
    status: "Active",
  },
];

const emptyForm: ResourceFormData = {
  name: "",
  type: "",
  client: "",
  project: "",
  url: "",
  status: "Active",
};

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateForm(form: ResourceFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Resource name is required.";
  }

  if (!form.type) {
    errors.type = "Type is required.";
  }

  if (!form.client) {
    errors.client = "Client is required.";
  }

  if (!form.project) {
    errors.project = "Project is required.";
  }

  if (!form.url.trim()) {
    errors.url = "URL is required.";
  } else if (!isValidHttpUrl(form.url.trim())) {
    errors.url = "URL must start with http:// or https://.";
  }

  return errors;
}

export default function ResourcesPage() {
  const { clients, projects } = useAppData();
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ResourceFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const projectOptions = form.client
    ? projects.filter((project) => project.client === form.client)
    : [];

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

    const newResource: Resource = {
      id: `resource-${Date.now()}`,
      name: form.name.trim(),
      type: form.type as ResourceType,
      client: form.client,
      project: form.project,
      url: form.url.trim(),
      status: form.status,
    };

    setResources((currentResources) => [...currentResources, newResource]);
    closeModal();
  }

  return (
    <>
      <main className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Resources</h1>
            <p className={styles.subtitle}>
              Manage useful QA and project resources.
            </p>
          </div>

          <button
            type="button"
            className={styles.addButton}
            onClick={openModal}
          >
            + Add Resource
          </button>
        </div>

        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Type</th>
                <th>Client</th>
                <th>Project</th>
                <th>URL</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td className={styles.resourceName}>{resource.name}</td>
                  <td className={styles.secondaryText}>{resource.type}</td>
                  <td className={styles.secondaryText}>{resource.client}</td>
                  <td className={styles.secondaryText}>{resource.project}</td>
                  <td className={styles.urlText}>{resource.url}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        resource.status === "Active"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {resource.status}
                    </span>
                  </td>
                  <td>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.openAction}
                      aria-label={`Open ${resource.name}`}
                    >
                      Open ↗
                    </a>
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
            aria-labelledby="add-resource-title"
            className={styles.modal}
          >
            <h2 id="add-resource-title" className={styles.modalTitle}>
              Add Resource
            </h2>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="resource-name" className={styles.label}>
                  Resource Name *
                </label>
                <input
                  id="resource-name"
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
                    errors.name ? "resource-name-error" : undefined
                  }
                />
                {errors.name && (
                  <p id="resource-name-error" className={styles.error}>
                    {errors.name}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="resource-type" className={styles.label}>
                  Type *
                </label>
                <select
                  id="resource-type"
                  className={styles.select}
                  value={form.type}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      type: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.type)}
                  aria-describedby={
                    errors.type ? "resource-type-error" : undefined
                  }
                >
                  <option value="">Select a type</option>
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p id="resource-type-error" className={styles.error}>
                    {errors.type}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="resource-client" className={styles.label}>
                  Client *
                </label>
                <select
                  id="resource-client"
                  className={styles.select}
                  value={form.client}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      client: event.target.value,
                      project: "",
                    }))
                  }
                  aria-invalid={Boolean(errors.client)}
                  aria-describedby={
                    errors.client ? "resource-client-error" : undefined
                  }
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.slug} value={client.name}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.client && (
                  <p id="resource-client-error" className={styles.error}>
                    {errors.client}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="resource-project" className={styles.label}>
                  Project *
                </label>
                <select
                  id="resource-project"
                  className={styles.select}
                  value={form.project}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      project: event.target.value,
                    }))
                  }
                  disabled={!form.client}
                  aria-invalid={Boolean(errors.project)}
                  aria-describedby={
                    errors.project ? "resource-project-error" : undefined
                  }
                >
                  <option value="">
                    {form.client
                      ? "Select a project"
                      : "Select a client first"}
                  </option>
                  {projectOptions.map((project) => (
                    <option key={project.slug} value={project.name}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {errors.project && (
                  <p id="resource-project-error" className={styles.error}>
                    {errors.project}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="resource-url" className={styles.label}>
                  URL *
                </label>
                <input
                  id="resource-url"
                  type="url"
                  className={styles.input}
                  value={form.url}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      url: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.url)}
                  aria-describedby={
                    errors.url ? "resource-url-error" : undefined
                  }
                />
                {errors.url && (
                  <p id="resource-url-error" className={styles.error}>
                    {errors.url}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="resource-status" className={styles.label}>
                  Status *
                </label>
                <select
                  id="resource-status"
                  className={styles.select}
                  value={form.status}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      status: event.target.value as ResourceStatus,
                    }))
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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
                  Add Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
