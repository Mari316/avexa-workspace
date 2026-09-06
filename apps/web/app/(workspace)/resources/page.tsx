"use client";

import { FormEvent, useEffect, useState } from "react";

import { useAppData } from "../../../context/AppDataContext";
import {
  createResource,
  deleteResource,
  listResources,
  updateResource,
  type ResourceDTO,
} from "../../../lib/api/resources";
import { ApiError } from "../../../lib/api/request";
import { usePermission } from "../../../lib/auth/use-permission";

import styles from "./page.module.css";

type ResourceType = ResourceDTO["type"];
type ResourceStatus = ResourceDTO["status"];

type ResourceFormData = {
  name: string;
  type: string;
  clientId: string;
  projectId: string;
  url: string;
  status: ResourceStatus;
};

type FormErrors = {
  name?: string;
  type?: string;
  clientId?: string;
  projectId?: string;
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

const emptyForm: ResourceFormData = {
  name: "",
  type: "",
  clientId: "",
  projectId: "",
  url: "",
  status: "Active",
};

function isAbsoluteHttpUrl(value: string): boolean {
  if (value.startsWith("//")) {
    return false;
  }

  try {
    const parsed = new URL(value);

    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname.length > 0
    );
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

  if (!form.clientId) {
    errors.clientId = "Client is required.";
  }

  if (!form.projectId) {
    errors.projectId = "Project is required.";
  }

  if (!form.url.trim()) {
    errors.url = "URL is required.";
  } else if (!isAbsoluteHttpUrl(form.url.trim())) {
    errors.url = "URL must start with http:// or https://.";
  }

  return errors;
}

function resourceToFormData(resource: ResourceDTO): ResourceFormData {
  return {
    name: resource.name,
    type: resource.type,
    clientId: resource.clientId,
    projectId: resource.projectId,
    url: resource.url,
    status: resource.status,
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "PROJECT_NOT_FOUND":
        return "The selected project does not exist.";
      case "RESOURCE_NOT_FOUND":
        return "That resource is no longer available.";
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

export default function ResourcesPage() {
  const { clients, getProjectsByClientId } = useAppData();
  const canCreate = usePermission("resources:create");
  const canUpdate = usePermission("resources:update");
  const canDelete = usePermission("resources:delete");
  const [resources, setResources] = useState<ResourceDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [deleteResourceId, setDeleteResourceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [form, setForm] = useState<ResourceFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listResources()
      .then((rows) => {
        if (cancelled) {
          return;
        }

        setResources(rows);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setResources([]);
        setLoadError(toErrorMessage(error));
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
    if (!showSuccessBanner) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSuccessBanner(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [showSuccessBanner]);

  const projectOptions = form.clientId
    ? getProjectsByClientId(form.clientId)
    : [];

  const resourceToDelete = deleteResourceId
    ? resources.find((resource) => resource.id === deleteResourceId)
    : undefined;

  function openAddModal() {
    setFormMode("add");
    setEditingResourceId(null);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
    setIsFormModalOpen(true);
  }

  function openEditModal(resource: ResourceDTO) {
    setFormMode("edit");
    setEditingResourceId(resource.id);
    setForm(resourceToFormData(resource));
    setErrors({});
    setFormError("");
    setIsFormModalOpen(true);
  }

  function closeFormModal() {
    if (isSaving) {
      return;
    }

    setIsFormModalOpen(false);
    setEditingResourceId(null);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return;
    }

    setDeleteResourceId(null);
    setDeleteError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    setFormError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      if (formMode === "add") {
        const created = await createResource({
          name: form.name.trim(),
          url: form.url.trim(),
          type: form.type as ResourceType,
          status: form.status,
          projectId: form.projectId,
        });

        setResources((current) => [...current, created]);
      } else if (editingResourceId) {
        const updated = await updateResource(editingResourceId, {
          name: form.name.trim(),
          url: form.url.trim(),
          type: form.type as ResourceType,
          status: form.status,
          projectId: form.projectId,
        });

        setResources((current) =>
          current.map((resource) =>
            resource.id === editingResourceId ? updated : resource,
          ),
        );
      }

      setIsFormModalOpen(false);
      setEditingResourceId(null);
      setForm(emptyForm);
      setErrors({});
      setFormError("");
    } catch (error) {
      setFormError(toErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteResourceId || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteResource(deleteResourceId);
      setResources((current) =>
        current.filter((resource) => resource.id !== deleteResourceId),
      );
      setDeleteResourceId(null);
      setShowSuccessBanner(true);
    } catch (error) {
      setDeleteError(toErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <main className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Resources</h1>
            <p className={styles.subtitle}>
              Links the workspace uses for projects.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              className={styles.addButton}
              onClick={openAddModal}
            >
              + Add Resource
            </button>
          )}
        </div>

        {showSuccessBanner ? (
          <div className={styles.successBanner} role="status">
            Resource deleted successfully
          </div>
        ) : null}

        {isLoading ? (
          <p className={styles.status}>Loading resources…</p>
        ) : loadError ? (
          <p className={styles.loadError} role="alert">
            {loadError}
          </p>
        ) : resources.length === 0 ? (
          <p className={styles.emptyState}>No resources yet.</p>
        ) : (
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
                    <td className={styles.secondaryText}>{resource.clientName}</td>
                    <td className={styles.secondaryText}>{resource.projectName}</td>
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
                      <div className={styles.rowActions}>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.openAction}
                          aria-label={`Open ${resource.name}`}
                        >
                          Open ↗
                        </a>
                        {canUpdate ? (
                          <button
                            type="button"
                            className={styles.actionButton}
                            onClick={() => openEditModal(resource)}
                          >
                            Edit
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            onClick={() => {
                              setDeleteError("");
                              setDeleteResourceId(resource.id);
                            }}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {isFormModalOpen ? (
        <div className={styles.backdrop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-form-title"
            className={styles.modal}
          >
            <h2 id="resource-form-title" className={styles.modalTitle}>
              {formMode === "add" ? "Add Resource" : "Edit Resource"}
            </h2>

            <form className={styles.form} onSubmit={handleSubmit}>
              {formError ? (
                <p className={styles.error} role="alert">
                  {formError}
                </p>
              ) : null}

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
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "resource-name-error" : undefined
                  }
                />
                {errors.name ? (
                  <p id="resource-name-error" className={styles.error}>
                    {errors.name}
                  </p>
                ) : null}
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
                  disabled={isSaving}
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
                {errors.type ? (
                  <p id="resource-type-error" className={styles.error}>
                    {errors.type}
                  </p>
                ) : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="resource-client" className={styles.label}>
                  Client *
                </label>
                <select
                  id="resource-client"
                  className={styles.select}
                  value={form.clientId}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      clientId: event.target.value,
                      projectId: "",
                    }))
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.clientId)}
                  aria-describedby={
                    errors.clientId ? "resource-client-error" : undefined
                  }
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.clientId ? (
                  <p id="resource-client-error" className={styles.error}>
                    {errors.clientId}
                  </p>
                ) : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="resource-project" className={styles.label}>
                  Project *
                </label>
                <select
                  id="resource-project"
                  className={styles.select}
                  value={form.projectId}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      projectId: event.target.value,
                    }))
                  }
                  disabled={isSaving || !form.clientId}
                  aria-invalid={Boolean(errors.projectId)}
                  aria-describedby={
                    errors.projectId ? "resource-project-error" : undefined
                  }
                >
                  <option value="">
                    {form.clientId
                      ? "Select a project"
                      : "Select a client first"}
                  </option>
                  {projectOptions.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {errors.projectId ? (
                  <p id="resource-project-error" className={styles.error}>
                    {errors.projectId}
                  </p>
                ) : null}
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
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.url)}
                  aria-describedby={
                    errors.url ? "resource-url-error" : undefined
                  }
                />
                {errors.url ? (
                  <p id="resource-url-error" className={styles.error}>
                    {errors.url}
                  </p>
                ) : null}
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
                  disabled={isSaving}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={closeFormModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSaving}
                  aria-busy={isSaving}
                >
                  {isSaving
                    ? "Saving…"
                    : formMode === "add"
                      ? "Add Resource"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteResourceId && resourceToDelete ? (
        <div className={styles.backdrop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-resource-title"
            className={styles.modal}
          >
            <h2 id="delete-resource-title" className={styles.modalTitle}>
              Delete Resource
            </h2>

            <p className={styles.confirmMessage}>
              Are you sure you want to delete &quot;{resourceToDelete.name}
              &quot;?
              <br />
              This action cannot be undone.
            </p>

            {deleteError ? (
              <p className={styles.error} role="alert">
                {deleteError}
              </p>
            ) : null}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmButton}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                aria-busy={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete Resource"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
