"use client";

import { FormEvent, useEffect, useState } from "react";


import styles from "./page.module.css";

type TeamRole =
  | "QA Engineer"
  | "Senior QA Engineer"
  | "Automation Engineer"
  | "QA Lead"
  | "QA Manager";

type TeamStatus = "Active" | "Inactive";

type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: TeamRole;
  projectCount: number;
  status: TeamStatus;
  isCurrentUser: boolean;
};

type TeamFormData = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: TeamStatus;
};

type FormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
};

const roleOptions: TeamRole[] = [
  "QA Engineer",
  "Senior QA Engineer",
  "Automation Engineer",
  "QA Lead",
  "QA Manager",
];

const initialTeamMembers: TeamMember[] = [
  {
    id: "team-1",
    firstName: "Mari",
    lastName: "Astapova",
    email: "mari@avexa.test",
    role: "Senior QA Engineer",
    projectCount: 3,
    status: "Active",
    isCurrentUser: true,
  },
  {
    id: "team-2",
    firstName: "Chris",
    lastName: "Miller",
    email: "chris@avexa.test",
    role: "QA Engineer",
    projectCount: 2,
    status: "Active",
    isCurrentUser: false,
  },
  {
    id: "team-3",
    firstName: "Alex",
    lastName: "Brown",
    email: "alex@avexa.test",
    role: "QA Engineer",
    projectCount: 1,
    status: "Active",
    isCurrentUser: false,
  },
  {
    id: "team-4",
    firstName: "Sofia",
    lastName: "Chen",
    email: "sofia@avexa.test",
    role: "Automation Engineer",
    projectCount: 2,
    status: "Active",
    isCurrentUser: false,
  },
  {
    id: "team-5",
    firstName: "Daniel",
    lastName: "Kim",
    email: "daniel@avexa.test",
    role: "QA Engineer",
    projectCount: 0,
    status: "Inactive",
    isCurrentUser: false,
  },
];

const emptyForm: TeamFormData = {
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  status: "Active",
};

function formatMemberName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

function formatProjects(count: number): string {
  if (count === 1) {
    return "1 project";
  }

  return `${count} projects`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isDuplicateEmail(
  email: string,
  members: TeamMember[],
  excludeId?: string,
): boolean {
  const normalizedEmail = email.trim().toLowerCase();

  return members.some(
    (member) =>
      member.id !== excludeId &&
      member.email.trim().toLowerCase() === normalizedEmail,
  );
}

function memberToFormData(member: TeamMember): TeamFormData {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    role: member.role,
    status: member.status,
  };
}

function validateForm(
  form: TeamFormData,
  members: TeamMember[],
  excludeId?: string,
): FormErrors {
  const errors: FormErrors = {};

  if (!form.firstName.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  } else if (isDuplicateEmail(form.email, members, excludeId)) {
    errors.email = "A team member with this email already exists.";
  }

  if (!form.role) {
    errors.role = "Role is required.";
  }

  return errors;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState<TeamFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const memberToDelete = deleteMemberId
    ? members.find((member) => member.id === deleteMemberId)
    : undefined;

  useEffect(() => {
    if (!showSuccessBanner) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSuccessBanner(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [showSuccessBanner]);

  function openAddModal() {
    setFormMode("add");
    setEditingMemberId(null);
    setForm(emptyForm);
    setErrors({});
    setIsFormModalOpen(true);
  }

  function openEditModal(member: TeamMember) {
    setFormMode("edit");
    setEditingMemberId(member.id);
    setForm(memberToFormData(member));
    setErrors({});
    setIsFormModalOpen(true);
  }

  function closeFormModal() {
    setIsFormModalOpen(false);
    setEditingMemberId(null);
    setForm(emptyForm);
    setErrors({});
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return;
    }

    setDeleteMemberId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(
      form,
      members,
      formMode === "edit" ? (editingMemberId ?? undefined) : undefined,
    );
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (formMode === "add") {
      const newMember: TeamMember = {
        id: `team-${Date.now()}`,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role: form.role as TeamRole,
        projectCount: 0,
        status: form.status,
        isCurrentUser: false,
      };

      setMembers((currentMembers) => [...currentMembers, newMember]);
    } else if (editingMemberId) {
      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.id === editingMemberId
            ? {
                ...member,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                role: form.role as TeamRole,
                status: form.status,
              }
            : member,
        ),
      );
    }

    closeFormModal();
  }

  function handleConfirmDelete() {
    if (!deleteMemberId || isDeleting) {
      return;
    }

    const member = members.find((item) => item.id === deleteMemberId);

    if (!member || member.isCurrentUser) {
      return;
    }

    setIsDeleting(true);
    setMembers((currentMembers) =>
      currentMembers.filter((item) => item.id !== deleteMemberId),
    );
    setDeleteMemberId(null);
    setIsDeleting(false);
    setShowSuccessBanner(true);
  }

  return (
    <>
      <main className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Team</h1>
            <p className={styles.subtitle}>
              Manage QA team members and workspace access.
            </p>
          </div>

          <button
            type="button"
            className={styles.addButton}
            onClick={openAddModal}
          >
            + Add Team Member
          </button>
        </div>

        {showSuccessBanner && (
          <div className={styles.successBanner} role="status">
            Team member deleted successfully
          </div>
        )}

        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Projects</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td className={styles.memberName}>
                    {formatMemberName(member.firstName, member.lastName)}
                  </td>
                  <td className={styles.secondaryText}>{member.email}</td>
                  <td className={styles.secondaryText}>{member.role}</td>
                  <td className={styles.secondaryText}>
                    {formatProjects(member.projectCount)}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        member.status === "Active"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => openEditModal(member)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => setDeleteMemberId(member.id)}
                        disabled={member.isCurrentUser}
                        title={
                          member.isCurrentUser
                            ? "You cannot delete your own account."
                            : undefined
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {isFormModalOpen && (
        <div className={styles.backdrop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-form-title"
            className={styles.modal}
          >
            <h2 id="team-form-title" className={styles.modalTitle}>
              {formMode === "add" ? "Add Team Member" : "Edit Team Member"}
            </h2>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="team-first-name" className={styles.label}>
                  First Name *
                </label>
                <input
                  id="team-first-name"
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
                    errors.firstName ? "team-first-name-error" : undefined
                  }
                />
                {errors.firstName && (
                  <p id="team-first-name-error" className={styles.error}>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="team-last-name" className={styles.label}>
                  Last Name *
                </label>
                <input
                  id="team-last-name"
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
                    errors.lastName ? "team-last-name-error" : undefined
                  }
                />
                {errors.lastName && (
                  <p id="team-last-name-error" className={styles.error}>
                    {errors.lastName}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="team-email" className={styles.label}>
                  Email *
                </label>
                <input
                  id="team-email"
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
                    errors.email ? "team-email-error" : undefined
                  }
                />
                {errors.email && (
                  <p id="team-email-error" className={styles.error}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="team-role" className={styles.label}>
                  Role *
                </label>
                <select
                  id="team-role"
                  className={styles.select}
                  value={form.role}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      role: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.role)}
                  aria-describedby={
                    errors.role ? "team-role-error" : undefined
                  }
                >
                  <option value="">Select a role</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p id="team-role-error" className={styles.error}>
                    {errors.role}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="team-status" className={styles.label}>
                  Status *
                </label>
                <select
                  id="team-status"
                  className={styles.select}
                  value={form.status}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      status: event.target.value as TeamStatus,
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
                  onClick={closeFormModal}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {formMode === "add" ? "Add Team Member" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteMemberId && memberToDelete && !memberToDelete.isCurrentUser && (
        <div className={styles.backdrop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-team-member-title"
            className={styles.modal}
          >
            <h2 id="delete-team-member-title" className={styles.modalTitle}>
              Delete Team Member
            </h2>

            <p className={styles.confirmMessage}>
              Are you sure you want to delete &quot;
              {formatMemberName(
                memberToDelete.firstName,
                memberToDelete.lastName,
              )}
              &quot;?
              <br />
              This action cannot be undone.
            </p>

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
              >
                Delete Team Member
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
