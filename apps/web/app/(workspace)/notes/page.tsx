"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAppData } from "../../../context/AppDataContext";
import {
  createNote,
  deleteNote,
  listNotes,
  updateNote,
  type NoteDTO,
} from "../../../lib/api/notes";
import { ApiError } from "../../../lib/api/request";
import { usePermission } from "../../../lib/auth/use-permission";
import { requireCssClass } from "../../../lib/css-class";

import styles from "./page.module.css";

type NoteCategory = NoteDTO["category"];

type NoteFormData = {
  title: string;
  clientId: string;
  projectId: string;
  category: string;
  content: string;
  pinned: boolean;
};

type FormErrors = {
  title?: string;
  clientId?: string;
  projectId?: string;
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
  Testing: requireCssClass(styles.categoryTesting),
  Automation: requireCssClass(styles.categoryAutomation),
  Investigation: requireCssClass(styles.categoryInvestigation),
  Bug: requireCssClass(styles.categoryBug),
  General: requireCssClass(styles.categoryGeneral),
};

const emptyForm: NoteFormData = {
  title: "",
  clientId: "",
  projectId: "",
  category: "",
  content: "",
  pinned: false,
};

function formatCreatedDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function compareNotes(left: NoteDTO, right: NoteDTO): number {
  if (left.pinned !== right.pinned) {
    return left.pinned ? -1 : 1;
  }

  const created = left.createdAt.localeCompare(right.createdAt);

  if (created !== 0) {
    return created;
  }

  return left.slug.localeCompare(right.slug);
}

function sortNotes(notes: NoteDTO[]): NoteDTO[] {
  return [...notes].sort(compareNotes);
}

function validateForm(form: NoteFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!form.clientId) {
    errors.clientId = "Client is required.";
  }

  if (!form.projectId) {
    errors.projectId = "Project is required.";
  }

  if (!form.category) {
    errors.category = "Category is required.";
  }

  if (!form.content.trim()) {
    errors.content = "Note is required.";
  }

  return errors;
}

function noteToFormData(note: NoteDTO): NoteFormData {
  return {
    title: note.title,
    clientId: note.clientId,
    projectId: note.projectId,
    category: note.category,
    content: note.content,
    pinned: note.pinned,
  };
}

function toFormErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "NOTE_TITLE_NOT_SLUGGABLE":
        return "Enter a note title containing letters or numbers.";
      case "PROJECT_NOT_FOUND":
        return "The selected project does not exist.";
      case "NOTE_NOT_FOUND":
        return "That note is no longer available.";
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

export default function NotesPage() {
  const { clients, getProjectsByClientId } = useAppData();
  const canCreateNote = usePermission("notes:create");
  const canUpdateNote = usePermission("notes:update");
  const canDeleteNote = usePermission("notes:delete");
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [notesError, setNotesError] = useState("");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingNoteSlug, setEditingNoteSlug] = useState<string | null>(null);
  const [deleteNoteSlug, setDeleteNoteSlug] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [form, setForm] = useState<NoteFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listNotes()
      .then((rows) => {
        if (cancelled) {
          return;
        }

        setNotes(rows);
        setNotesError("");
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setNotes([]);
        setNotesError(toFormErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingNotes(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const projectOptions = form.clientId
    ? getProjectsByClientId(form.clientId)
    : [];

  const sortedNotes = useMemo(() => sortNotes(notes), [notes]);

  const noteToDelete = deleteNoteSlug
    ? notes.find((note) => note.slug === deleteNoteSlug)
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
    setEditingNoteSlug(null);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
    setIsFormModalOpen(true);
  }

  function openEditModal(note: NoteDTO) {
    setFormMode("edit");
    setEditingNoteSlug(note.slug);
    setForm(noteToFormData(note));
    setErrors({});
    setFormError("");
    setIsFormModalOpen(true);
  }

  function closeFormModal() {
    if (isSaving) {
      return;
    }

    setIsFormModalOpen(false);
    setEditingNoteSlug(null);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return;
    }

    setDeleteNoteSlug(null);
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
        const created = await createNote({
          title: form.title.trim(),
          content: form.content.trim(),
          projectId: form.projectId,
          category: form.category as NoteCategory,
          pinned: form.pinned,
        });

        setNotes((currentNotes) => sortNotes([...currentNotes, created]));
      } else if (editingNoteSlug) {
        const updated = await updateNote(editingNoteSlug, {
          title: form.title.trim(),
          content: form.content.trim(),
          projectId: form.projectId,
          category: form.category as NoteCategory,
          pinned: form.pinned,
        });

        setNotes((currentNotes) =>
          sortNotes(
            currentNotes.map((note) =>
              note.slug === editingNoteSlug ? updated : note,
            ),
          ),
        );
      }

      setIsFormModalOpen(false);
      setEditingNoteSlug(null);
      setForm(emptyForm);
      setErrors({});
      setFormError("");
    } catch (error) {
      setFormError(toFormErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteNoteSlug || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteNote(deleteNoteSlug);
      setNotes((currentNotes) =>
        currentNotes.filter((note) => note.slug !== deleteNoteSlug),
      );
      setDeleteNoteSlug(null);
      setShowSuccessBanner(true);
    } catch (error) {
      setDeleteError(toFormErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
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

          {canCreateNote && (
            <button
              type="button"
              className={styles.addButton}
              onClick={openAddModal}
            >
              + Add Note
            </button>
          )}
        </div>

        {showSuccessBanner && (
          <div className={styles.successBanner} role="status">
            Note deleted successfully
          </div>
        )}

        {notesError ? (
          <p className={styles.loadError} role="alert">
            {notesError}
          </p>
        ) : null}

        <div className={styles.cardGrid}>
          {isLoadingNotes ? (
            <p className={styles.emptyState}>Loading notes…</p>
          ) : notesError ? null : sortedNotes.length === 0 ? (
            <p className={styles.emptyState}>No notes yet.</p>
          ) : (
            sortedNotes.map((note) => (
              <article key={note.slug} className={styles.noteCard}>
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
                    <span className={styles.metaValue}>{note.clientName}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Project</span>
                    <span className={styles.metaValue}>{note.projectName}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Author</span>
                    <span className={styles.metaValue}>{note.author}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Created</span>
                    <span className={styles.metaValue}>
                      {formatCreatedDate(note.createdAt)}
                    </span>
                  </div>
                </div>

                <div className={styles.noteFooter}>
                  <span
                    className={`${styles.badge} ${categoryBadgeClass[note.category]}`}
                  >
                    {note.category}
                  </span>

                  <div className={styles.cardActions}>
                    {canUpdateNote && (
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => openEditModal(note)}
                      >
                        Edit
                      </button>
                    )}
                    {canDeleteNote && (
                      <button
                        type="button"
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => {
                          setDeleteError("");
                          setDeleteNoteSlug(note.slug);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
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
              {formError ? (
                <p className={styles.error} role="alert">
                  {formError}
                </p>
              ) : null}

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
                  disabled={isSaving}
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
                    errors.clientId ? "note-client-error" : undefined
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
                  <p id="note-client-error" className={styles.error}>
                    {errors.clientId}
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
                  value={form.projectId}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      projectId: event.target.value,
                    }))
                  }
                  disabled={!form.clientId || isSaving}
                  aria-invalid={Boolean(errors.projectId)}
                  aria-describedby={
                    errors.projectId ? "note-project-error" : undefined
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
                {errors.projectId && (
                  <p id="note-project-error" className={styles.error}>
                    {errors.projectId}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
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
                      ? "Add Note"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteNoteSlug && noteToDelete && (
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
                {isDeleting ? "Deleting…" : "Delete Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
