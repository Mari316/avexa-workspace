"use client";

import { FormEvent, useState } from "react";

import AppLayout from "../../components/layout/AppLayout";

import styles from "./page.module.css";

type ContactStatus = "Active" | "Inactive";

type ContactClient = "Pax8" | "Cybertek" | "OrangeHRM" | "Lemonade";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  client: string;
  email: string;
  role: string;
  status: ContactStatus;
};

type ContactFormData = {
  firstName: string;
  lastName: string;
  client: string;
  email: string;
  role: string;
  status: ContactStatus;
};

type FormErrors = {
  firstName?: string;
  lastName?: string;
  client?: string;
  email?: string;
  role?: string;
};

const clientOptions: ContactClient[] = [
  "Pax8",
  "Cybertek",
  "OrangeHRM",
  "Lemonade",
];

const initialContacts: Contact[] = [
  {
    id: "contact-1",
    firstName: "Mitchell",
    lastName: "Lubbers",
    client: "Pax8",
    email: "mitchell.lubbers@pax8.com",
    role: "QA Director",
    status: "Active",
  },
  {
    id: "contact-2",
    firstName: "Jennifer",
    lastName: "Walsh",
    client: "Pax8",
    email: "jennifer.walsh@pax8.com",
    role: "Partner Success Manager",
    status: "Active",
  },
  {
    id: "contact-3",
    firstName: "John",
    lastName: "Smith",
    client: "Cybertek",
    email: "john.smith@cybertek.com",
    role: "Engineering Lead",
    status: "Active",
  },
  {
    id: "contact-4",
    firstName: "Emily",
    lastName: "Chen",
    client: "Cybertek",
    email: "emily.chen@cybertek.com",
    role: "Automation Engineer",
    status: "Active",
  },
  {
    id: "contact-5",
    firstName: "Sarah",
    lastName: "Lee",
    client: "OrangeHRM",
    email: "sarah.lee@orangehrm.com",
    role: "Product Owner",
    status: "Active",
  },
  {
    id: "contact-6",
    firstName: "Alex",
    lastName: "Brown",
    client: "Lemonade",
    email: "alex.brown@lemonade.com",
    role: "QA Manager",
    status: "Inactive",
  },
];

const emptyForm: ContactFormData = {
  firstName: "",
  lastName: "",
  client: "",
  email: "",
  role: "",
  status: "Active",
};

function formatContactName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

function validateForm(form: ContactFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.firstName.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!form.client) {
    errors.client = "Client is required.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  }

  if (!form.role.trim()) {
    errors.role = "Role is required.";
  }

  return errors;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ContactFormData>(emptyForm);
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

    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      client: form.client,
      email: form.email.trim(),
      role: form.role.trim(),
      status: form.status,
    };

    setContacts((currentContacts) => [...currentContacts, newContact]);
    closeModal();
  }

  return (
    <AppLayout>
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
            onClick={openModal}
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
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className={styles.contactName}>
                    {formatContactName(contact.firstName, contact.lastName)}
                  </td>
                  <td className={styles.secondaryText}>{contact.client}</td>
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
                    <button
                      type="button"
                      className={styles.viewAction}
                      aria-label={`View ${formatContactName(contact.firstName, contact.lastName)}`}
                    >
                      View →
                    </button>
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
            aria-labelledby="add-contact-title"
            className={styles.modal}
          >
            <h2 id="add-contact-title" className={styles.modalTitle}>
              Add Contact
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
                  value={form.client}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      client: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.client)}
                  aria-describedby={
                    errors.client ? "contact-client-error" : undefined
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
                  <p id="contact-client-error" className={styles.error}>
                    {errors.client}
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

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
