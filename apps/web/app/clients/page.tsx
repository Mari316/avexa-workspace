"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import AppLayout from "../../components/layout/AppLayout";
import {
  clients as initialClients,
  getClientSlug,
  type Client,
  type ClientStatus,
} from "../../lib/mockData";

import styles from "./page.module.css";

type ClientFormData = {
  name: string;
  primaryContact: string;
  contactEmail: string;
  status: ClientStatus;
};

type FormErrors = {
  name?: string;
  primaryContact?: string;
};

const emptyForm: ClientFormData = {
  name: "",
  primaryContact: "",
  contactEmail: "",
  status: "Active",
};

function formatProjects(count: number): string {
  return count === 1 ? "1 project" : `${count} projects`;
}

function validateForm(form: ClientFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Client name is required.";
  }

  if (!form.primaryContact.trim()) {
    errors.primaryContact = "Primary contact is required.";
  }

  return errors;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
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

    const newClient: Client = {
      name: form.name.trim(),
      slug: getClientSlug(form.name.trim()),
      projectCount: 0,
      primaryContact: form.primaryContact.trim(),
      contactEmail: form.contactEmail.trim(),
      status: form.status,
    };

    setClients((currentClients) => [...currentClients, newClient]);
    closeModal();
  }

  return (
    <AppLayout>
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
            onClick={openModal}
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
              {clients.map((client) => (
                <tr key={client.name}>
                  <td className={styles.clientName}>{client.name}</td>
                  <td className={styles.secondaryText}>
                    {formatProjects(client.projectCount)}
                  </td>
                  <td className={styles.secondaryText}>
                    {client.primaryContact}
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
                    <Link
                      href={`/clients/${client.slug}`}
                      className={styles.viewAction}
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
            aria-labelledby="add-client-title"
            className={styles.modal}
          >
            <h2 id="add-client-title" className={styles.modalTitle}>
              Add Client
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
                  aria-describedby={errors.name ? "client-name-error" : undefined}
                />
                {errors.name && (
                  <p id="client-name-error" className={styles.error}>
                    {errors.name}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="primary-contact" className={styles.label}>
                  Primary Contact *
                </label>
                <input
                  id="primary-contact"
                  type="text"
                  className={styles.input}
                  value={form.primaryContact}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      primaryContact: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.primaryContact)}
                  aria-describedby={
                    errors.primaryContact ? "primary-contact-error" : undefined
                  }
                />
                {errors.primaryContact && (
                  <p id="primary-contact-error" className={styles.error}>
                    {errors.primaryContact}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-email" className={styles.label}>
                  Contact Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  className={styles.input}
                  value={form.contactEmail}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      contactEmail: event.target.value,
                    }))
                  }
                />
              </div>

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

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
