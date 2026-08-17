"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { useAppData, type ClientView } from "../../context/AppDataContext";
import { ApiError } from "../../lib/api/request";
import {
  formatContactName,
  resolveClientPrimaryContact,
  type ClientStatus,
} from "../../lib/mockData";

import styles from "./page.module.css";

type ClientFormData = {
  name: string;
  primaryContactId: string;
  status: ClientStatus;
};

type FormErrors = {
  name?: string;
  primaryContactId?: string;
};

const emptyForm: ClientFormData = {
  name: "",
  primaryContactId: "",
  status: "Active",
};

function formatProjects(count: number): string {
  return count === 1 ? "1 project" : `${count} projects`;
}

function validateForm(
  form: ClientFormData,
  mode: "add" | "edit",
  hasClientContacts: boolean,
): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Client name is required.";
  }

  if (mode === "edit" && hasClientContacts && !form.primaryContactId) {
    errors.primaryContactId = "Primary contact is required.";
  }

  return errors;
}

function toFormErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "CLIENT_SLUG_CONFLICT":
        return "A client with this name already exists.";
      case "CLIENT_NAME_NOT_SLUGGABLE":
        return "Enter a client name containing letters or numbers.";
      case "PRIMARY_CONTACT_CLIENT_MISMATCH":
        return "That contact belongs to a different client.";
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

export default function ClientsPage() {
  const {
    clients,
    contacts,
    projects,
    isLoadingClients,
    clientsError,
    addClient,
    updateClient,
  } = useAppData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingClientSlug, setEditingClientSlug] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const editingClient = editingClientSlug
    ? clients.find((client) => client.slug === editingClientSlug)
    : undefined;

  const clientContactsForEdit = useMemo(() => {
    if (!editingClient) {
      return [];
    }

    return contacts.filter((contact) => contact.clientId === editingClient.id);
  }, [contacts, editingClient]);

  const projectCountByClient = useMemo(() => {
    const counts = new Map<string, number>();

    for (const project of projects) {
      counts.set(project.clientId, (counts.get(project.clientId) ?? 0) + 1);
    }

    return counts;
  }, [projects]);

  function openAddModal() {
    setFormMode("add");
    setEditingClientSlug(null);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(client: ClientView) {
    setFormMode("edit");
    setEditingClientSlug(client.slug);
    setForm({
      name: client.name,
      primaryContactId: client.primaryContactId ?? "",
      status: client.status,
    });
    setErrors({});
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormMode("add");
    setEditingClientSlug(null);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(
      form,
      formMode,
      clientContactsForEdit.length > 0,
    );
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setFormError("");
    setIsSaving(true);

    try {
      if (formMode === "add") {
        await addClient({ name: form.name.trim(), status: form.status });
      } else if (editingClientSlug) {
        await updateClient(editingClientSlug, {
          name: form.name.trim(),
          primaryContactId: form.primaryContactId || null,
          status: form.status,
        });
      }

      // The modal only closes once the API has confirmed the change.
      closeModal();
    } catch (error) {
      setFormError(toFormErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  const selectedPrimaryContact = clientContactsForEdit.find(
    (contact) => contact.id === form.primaryContactId,
  );

  return (
    <>
      <main className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Clients</h1>
            <p className={styles.subtitle}>
              Manage client organizations and their QA projects.
            </p>
          </div>

          <button
            type="button"
            className={styles.addButton}
            onClick={openAddModal}
          >
            + Add Client
          </button>
        </div>

        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Projects</th>
                <th>Primary Contact</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingClients && (
                <tr>
                  <td colSpan={5} className={styles.secondaryText}>
                    Loading clients…
                  </td>
                </tr>
              )}

              {!isLoadingClients && clientsError && (
                <tr>
                  <td colSpan={5} className={styles.error}>
                    {clientsError}
                  </td>
                </tr>
              )}

              {!isLoadingClients && !clientsError && clients.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.secondaryText}>
                    No clients yet.
                  </td>
                </tr>
              )}

              {!isLoadingClients &&
                clients.map((client) => {
                  const primaryContact = resolveClientPrimaryContact(
                    client,
                    contacts,
                  );

                  return (
                    <tr key={client.slug}>
                      <td className={styles.clientName}>{client.name}</td>
                      <td className={styles.secondaryText}>
                        {formatProjects(
                          projectCountByClient.get(client.id) ?? 0,
                        )}
                      </td>
                      <td className={styles.secondaryText}>
                        {primaryContact
                          ? formatContactName(
                              primaryContact.firstName,
                              primaryContact.lastName,
                            )
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            client.status === "Active"
                              ? styles.badgeActive
                              : styles.badgeOnHold
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <Link
                            href={`/clients/${client.slug}`}
                            className={styles.actionButton}
                          >
                            View →
                          </Link>
                          <button
                            type="button"
                            className={styles.actionButton}
                            onClick={() => openEditModal(client)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </main>

      {isModalOpen && (
        <div className={styles.backdrop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-form-title"
            className={styles.modal}
          >
            <h2 id="client-form-title" className={styles.modalTitle}>
              {formMode === "add" ? "Add Client" : "Edit Client"}
            </h2>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="client-name" className={styles.label}>
                  Client Name *
                </label>
                <input
                  id="client-name"
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
                    errors.name ? "client-name-error" : undefined
                  }
                />
                {errors.name && (
                  <p id="client-name-error" className={styles.error}>
                    {errors.name}
                  </p>
                )}
              </div>

              {formMode === "edit" && (
                <>
                  <div className={styles.field}>
                    <label htmlFor="primary-contact" className={styles.label}>
                      Primary Contact *
                    </label>
                    <select
                      id="primary-contact"
                      className={styles.select}
                      value={form.primaryContactId}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          primaryContactId: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(errors.primaryContactId)}
                      aria-describedby={
                        errors.primaryContactId
                          ? "primary-contact-error"
                          : undefined
                      }
                    >
                      <option value="">Select a contact</option>
                      {clientContactsForEdit.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {formatContactName(
                            contact.firstName,
                            contact.lastName,
                          )}
                        </option>
                      ))}
                    </select>
                    {errors.primaryContactId && (
                      <p id="primary-contact-error" className={styles.error}>
                        {errors.primaryContactId}
                      </p>
                    )}
                    {clientContactsForEdit.length === 0 && (
                      <p className={styles.helperText}>
                        Add contacts for this client before selecting a primary
                        contact.
                      </p>
                    )}
                  </div>

                  {selectedPrimaryContact && (
                    <div className={styles.field}>
                      <span className={styles.label}>Contact Email</span>
                      <p className={styles.readOnlyValue}>
                        {selectedPrimaryContact.email}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className={styles.field}>
                <label htmlFor="client-status" className={styles.label}>
                  Status *
                </label>
                <select
                  id="client-status"
                  className={styles.select}
                  value={form.status}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      status: event.target.value as ClientStatus,
                    }))
                  }
                >
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              {formError && (
                <p role="alert" className={styles.error}>
                  {formError}
                </p>
              )}

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
                  aria-busy={isSaving}
                >
                  {formMode === "add" ? "Add Client" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
