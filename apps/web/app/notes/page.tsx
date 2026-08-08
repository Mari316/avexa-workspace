"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAppData } from "../../context/AppDataContext";

import styles from "./page.module.css";

type NoteCategory =
  | "Testing"
  | "Automation"
  | "Investigation"
  | "Bug"
  | "General";

type Note = {
  id: string;
  title: string;
  content: string;
  client: string;
  project: string;
  author: string;
  createdDate: string;
  category: NoteCategory;
  pinned: boolean;
};

type NoteFormData = {
  title: string;
  client: string;
  project: string;
  category: string;
  content: string;
  pinned: boolean;
};

type FormErrors = {
  title?: string;
  client?: string;
  project?: string;
  category?: string;
  content?: string;
};

const categoryOptions: NoteCategory[] = [
  "Testing",
  "Automation",
  "Investigation",
  "Bug",
  "General",
];

const categoryBadgeClass: Record<NoteCategory, string> = {
  Testing: styles.categoryTesting,
  Automation: styles.categoryAutomation,
  Investigation: styles.categoryInvestigation,
  Bug: styles.categoryBug,
  General: styles.categoryGeneral,
};

const initialNotes: Note[] = [
  {
    id: "note-1",
    title: "Regression Testing Notes",
    content:
      "Regression coverage should include client creation, updates, and portal access flows.",
    client: "Pax8",
    project: "Account Management",
    author: "Mari",
    createdDate: "Aug 5",
    category: "Testing",
    pinned: true,
  },
  {
    id: "note-2",
    title: "API Investigation",
    content:
      "Validate error responses and authentication behavior before adding additional automation coverage.",
    client: "Pax8",
    project: "Public API",
    author: "Mari",
    createdDate: "Aug 6",
    category: "Investigation",
    pinned: false,
  },
  {
    id: "note-3",
    title: "OrangeHRM Automation",
    content:
      "Prioritize employee management and login flows for Playwright coverage.",
    client: "OrangeHRM",
    project: "OrangeHRM Automation",
    author: "Mari",
    createdDate: "Aug 7",
    category: "Automation",
    pinned: false,
  },
  {
    id: "note-4",
    title: "Login Bug Findings",
    content:
      "Login issue appears intermittently when the session has expired.",
    client: "Lemonade",
    project: "Lemonade Web",
    author: "Alex",
    createdDate: "Aug 7",
    category: "Bug",
    pinned: false,
  },
];

const emptyForm: NoteFormData = {
  title: "",
  client: "",
  project: "",
  category: "",
  content: "",
  pinned: false,
};

function formatCreatedDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function validateForm(form: NoteFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!form.client) {
    errors.client = "Client is required.";
  }

  if (!form.project) {
    errors.project = "Project is required.";
  }

  if (!form.category) {
    errors.category = "Category is required.";
  }

  if (!form.content.trim()) {
    errors.content = "Note is required.";
  }

  return errors;
}

function noteToFormData(note: Note): NoteFormData {
  return {
    title: note.title,
    client: note.client,
    project: note.project,
    category: note.category,
    content: note.content,
    pinned: note.pinned,
  };
}

export default function NotesPage() {
  const { clients, projects } = useAppData();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState<NoteFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const projectOptions = form.client
    ? projects.filter((project) => project.client === form.client)
    : [];

  const sortedNotes = useMemo(
    () =>
      [...notes].sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }

        return 0;
      }),
    [notes],
  );

  const noteToDelete = deleteNoteId
    ? notes.find((note) => note.id === deleteNoteId)
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
    setEditingNoteId(null);
    setForm(emptyForm);
    setErrors({});
    setIsFormModalOpen(true);
  }

  function openEditModal(note: Note) {
    setFormMode("edit");
    setEditingNoteId(note.id);
    setForm(noteToFormData(note));
    setErrors({});
    setIsFormModalOpen(true);
  }

  function closeFormModal() {
    setIsFormModalOpen(false);
    setEditingNoteId(null);
    setForm(emptyForm);
    setErrors({});
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return;
    }

    setDeleteNoteId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (formMode === "add") {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        title: form.title.trim(),
        content: form.content.trim(),
        client: form.client,
        project: form.project,
        author: "Mari",
        createdDate: formatCreatedDate(new Date()),
        category: form.category as NoteCategory,
        pinned: form.pinned,
      };

      setNotes((currentNotes) => [...currentNotes, newNote]);
    } else if (editingNoteId) {
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === editingNoteId
            ? {
                ...note,
                title: form.title.trim(),
                content: form.content.trim(),
                client: form.client,
                project: form.project,
                category: form.category as NoteCategory,
                pinned: form.pinned,
              }
            : note,
        ),
      );
    }

    closeFormModal();
  }

  function handleConfirmDelete() {
    if (!deleteNoteId || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setNotes((currentNotes) =>
      currentNotes.filter((note) => note.id !== deleteNoteId),
    );
    setDeleteNoteId(null);
    setIsDeleting(false);
    setShowSuccessBanner(true);
  }

  return (
    <>
      <main className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Notes</h1>
            <p className={styles.subtitle}>
              Capture QA notes, investigation findings, and project updates.
            </p>
          </div>

          <button
            type="button"
            className={styles.addButton}
            onClick={openAddModal}
          >
            + Add Note
          </button>
        </div>

        {showSuccessBanner && (
          <div className={styles.successBanner} role="status">
            Note deleted successfully
          </div>
        )}

        <div className={styles.cardGrid}>
          {sortedNotes.map((note) => (
            <article key={note.id} className={styles.noteCard}>
              <div className={styles.noteCardHeader}>
                <h2 className={styles.noteTitle}>{note.title}</h2>
                {note.pinned && (
                  <span className={styles.pinIndicator}>Pinned</span>
                )}
              </div>

              <p className={styles.noteContent}>{note.content}</p>

              <div className={styles.noteMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Client</span>
                  <span className={styles.metaValue}>{note.client}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Project</span>
                  <span className={styles.metaValue}>{note.project}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Author</span>
                  <span className={styles.metaValue}>{note.author}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Created</span>
                  <span className={styles.metaValue}>{note.createdDate}</span>
                </div>
              </div>

              <div className={styles.noteFooter}>
                <span
                  className={`${styles.badge} ${categoryBadgeClass[note.category]}`}
                >
                  {note.category}
                </span>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => openEditModal(note)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => setDeleteNoteId(note.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {isFormModalOpen && (
        <div className={styles.backdrop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-form-title"
            className={styles.modal}
          >
            <h2 id="note-form-title" className={styles.modalTitle}>
              {formMode === "add" ? "Add Note" : "Edit Note"}
            </h2>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="note-title" className={styles.label}>
                  Title *
                </label>
                <input
                  id="note-title"
                  type="text"
                  className={styles.input}
                  value={form.title}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      title: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={
                    errors.title ? "note-title-error" : undefined
                  }
                />
                {errors.title && (
                  <p id="note-title-error" className={styles.error}>
                    {errors.title}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="note-client" className={styles.label}>
                  Client *
                </label>
                <select
                  id="note-client"
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
                    errors.client ? "note-client-error" : undefined
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
                  <p id="note-client-error" className={styles.error}>
                    {errors.client}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="note-project" className={styles.label}>
                  Project *
                </label>
                <select
                  id="note-project"
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
                    errors.project ? "note-project-error" : undefined
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
                  <p id="note-project-error" className={styles.error}>
                    {errors.project}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="note-category" className={styles.label}>
                  Category *
                </label>
                <select
                  id="note-category"
                  className={styles.select}
                  value={form.category}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      category: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.category)}
                  aria-describedby={
                    errors.category ? "note-category-error" : undefined
                  }
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p id="note-category-error" className={styles.error}>
                    {errors.category}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="note-content" className={styles.label}>
                  Note *
                </label>
                <textarea
                  id="note-content"
                  className={styles.textarea}
                  value={form.content}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      content: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.content)}
                  aria-describedby={
                    errors.content ? "note-content-error" : undefined
                  }
                />
                {errors.content && (
                  <p id="note-content-error" className={styles.error}>
                    {errors.content}
                  </p>
                )}
              </div>

              <div className={styles.checkboxField}>
                <input
                  id="note-pinned"
                  type="checkbox"
                  className={styles.checkbox}
                  checked={form.pinned}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      pinned: event.target.checked,
                    }))
                  }
                />
                <label htmlFor="note-pinned" className={styles.checkboxLabel}>
                  Pinned
                </label>
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
                  {formMode === "add" ? "Add Note" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteNoteId && noteToDelete && (
        <div className={styles.backdrop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-note-title"
            className={styles.modal}
          >
            <h2 id="delete-note-title" className={styles.modalTitle}>
              Delete Note
            </h2>

            <p className={styles.confirmMessage}>
              Are you sure you want to delete &quot;{noteToDelete.title}&quot;?
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
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
