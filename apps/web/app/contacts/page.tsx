"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useAppData, type ContactView } from "../../context/AppDataContext";
import { ApiError } from "../../lib/api/request";
import { formatContactName, type ContactStatus } from "../../lib/mockData";

import styles from "./page.module.css";

type ContactFormData = {
  firstName: string;
  lastName: string;
  clientId: string;
  email: string;
  role: string;
  status: ContactStatus;
};

type FormErrors = {
  firstName?: string;
  lastName?: string;
  clientId?: string;
  email?: string;
  role?: string;
};

const emptyForm: ContactFormData = {
  firstName: "",
  lastName: "",
  clientId: "",
  email: "",
  role: "",
  status: "Active",
};

function validateForm(form: ContactFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.firstName.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!form.clientId) {
    errors.clientId = "Client is required.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  }

  if (!form.role.trim()) {
    errors.role = "Role is required.";
  }

  return errors;
}

function toFormErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "CONTACT_SLUG_CONFLICT":
        return "A contact with this name already exists.";
      case "CONTACT_NAME_NOT_SLUGGABLE":
        return "Enter a contact name containing letters or numbers.";
      case "CONTACT_IS_PRIMARY_CONTACT":
        return "This contact is the primary contact for its current client. Choose a different primary contact first.";
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

export default function ContactsPage() {
  const {
    clients,
    contacts,
    isLoadingContacts,
    contactsError,
    addContact,
    updateContact,
  } = useAppData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingContactSlug, setEditingContactSlug] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<ContactFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openAddModal() {
    setFormMode("add");
    setEditingContactSlug(null);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(contact: ContactView) {
    setFormMode("edit");
    setEditingContactSlug(contact.slug);
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      clientId: contact.clientId,
      email: contact.email,
      role: contact.role,
      status: contact.status,
    });
    setErrors({});
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormMode("add");
    setEditingContactSlug(null);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setFormError("");
    setIsSaving(true);

    try {
      if (formMode === "add") {
        await addContact({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          clientId: form.clientId,
          email: form.email.trim(),
          role: form.role.trim(),
          status: form.status,
        });
      } else if (editingContactSlug) {
        await updateContact(editingContactSlug, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          clientId: form.clientId,
          email: form.email.trim(),
          role: form.role.trim(),
          status: form.status,
        });
      }

      closeModal();
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
            <h1 className={styles.title}>Contacts</h1>
            <p className={styles.subtitle}>
              Manage client contacts and stakeholders.
            </p>
          </div>

          <button
            type="button"
            className={styles.addButton}
            onClick={openAddModal}
          >
            + Add Contact
          </button>
        </div>

        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Client</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingContacts ? (
                <tr>
                  <td colSpan={6} className={styles.secondaryText}>
                    Loading contacts…
                  </td>
                </tr>
              ) : contactsError ? (
                <tr>
                  <td colSpan={6} className={styles.error}>
                    {contactsError}
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.secondaryText}>
                    No contacts yet.
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className={styles.contactName}>
                      {formatContactName(contact.firstName, contact.lastName)}
                    </td>
                    <td className={styles.secondaryText}>
                      {contact.clientName}
                    </td>
                    <td className={styles.secondaryText}>{contact.email}</td>
                    <td className={styles.secondaryText}>{contact.role}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          contact.status === "Active"
                            ? styles.badgeActive
                            : styles.badgeInactive
                        }`}
                      >
                        {contact.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <Link
                          href={`/contacts/${contact.slug}`}
                          className={styles.actionButton}
                        >
                          View →
                        </Link>
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() => openEditModal(contact)}
                        >
                          Edit
                        </button>
                      </div>
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
            aria-labelledby="contact-form-title"
            className={styles.modal}
          >
            <h2 id="contact-form-title" className={styles.modalTitle}>
              {formMode === "add" ? "Add Contact" : "Edit Contact"}
            </h2>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="contact-first-name" className={styles.label}>
                  First Name *
                </label>
                <input
                  id="contact-first-name"
                  type="text"
                  className={styles.input}
                  value={form.firstName}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      firstName: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={
                    errors.firstName ? "contact-first-name-error" : undefined
                  }
                />
                {errors.firstName && (
                  <p id="contact-first-name-error" className={styles.error}>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-last-name" className={styles.label}>
                  Last Name *
                </label>
                <input
                  id="contact-last-name"
                  type="text"
                  className={styles.input}
                  value={form.lastName}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      lastName: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={
                    errors.lastName ? "contact-last-name-error" : undefined
                  }
                />
                {errors.lastName && (
                  <p id="contact-last-name-error" className={styles.error}>
                    {errors.lastName}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-client" className={styles.label}>
                  Client *
                </label>
                <select
                  id="contact-client"
                  className={styles.select}
                  value={form.clientId}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      clientId: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.clientId)}
                  aria-describedby={
                    errors.clientId ? "contact-client-error" : undefined
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
                  <p id="contact-client-error" className={styles.error}>
                    {errors.clientId}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-email" className={styles.label}>
                  Email *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  className={styles.input}
                  value={form.email}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      email: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "contact-email-error" : undefined
                  }
                />
                {errors.email && (
                  <p id="contact-email-error" className={styles.error}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-role" className={styles.label}>
                  Role *
                </label>
                <input
                  id="contact-role"
                  type="text"
                  className={styles.input}
                  value={form.role}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      role: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.role)}
                  aria-describedby={
                    errors.role ? "contact-role-error" : undefined
                  }
                />
                {errors.role && (
                  <p id="contact-role-error" className={styles.error}>
                    {errors.role}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-status" className={styles.label}>
                  Status *
                </label>
                <select
                  id="contact-status"
                  className={styles.select}
                  value={form.status}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      status: event.target.value as ContactStatus,
                    }))
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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
                  {formMode === "add" ? "Add Contact" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
