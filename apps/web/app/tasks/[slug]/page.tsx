"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAppData, type TaskView } from "../../../context/AppDataContext";
import { ApiError } from "../../../lib/api/request";
import { markTaskDeleteSuccess } from "../../../lib/deletedTasks";
import { notifyTaskUpdated } from "../../../lib/mockNotifications";
import {
  formatTaskDueDate,
  type TaskPriority,
  type TaskStatus,
} from "../../../lib/mockData";

import styles from "./page.module.css";

type TaskAssignee = "Mari" | "Chris" | "Alex";

type EditTaskFormData = {
  title: string;
  projectId: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
};

type FormErrors = {
  title?: string;
  projectId?: string;
  assignee?: string;
  dueDate?: string;
};

const assigneeOptions: TaskAssignee[] = ["Mari", "Chris", "Alex"];

const priorityBadgeClass: Record<TaskPriority, string> = {
  High: styles.priorityHigh,
  Medium: styles.priorityMedium,
  Low: styles.priorityLow,
};

const statusBadgeClass: Record<TaskStatus, string> = {
  "To Do": styles.statusToDo,
  "In Progress": styles.statusInProgress,
  Review: styles.statusReview,
  Blocked: styles.statusBlocked,
  Done: styles.statusDone,
};

function validateForm(form: EditTaskFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Task name is required.";
  }

  if (!form.projectId) {
    errors.projectId = "Project is required.";
  }

  if (!form.assignee) {
    errors.assignee = "Assignee is required.";
  }

  if (!form.dueDate) {
    errors.dueDate = "Due date is required.";
  }

  return errors;
}

function taskToFormData(task: TaskView): EditTaskFormData {
  return {
    title: task.title,
    projectId: task.projectId,
    assignee: task.assignee,
    dueDate: task.dueDate,
    priority: task.priority,
    status: task.status,
  };
}

function toFormErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "TASK_SLUG_CONFLICT":
        return "A task with this title already exists.";
      case "TASK_TITLE_NOT_SLUGGABLE":
        return "Enter a task title containing letters or numbers.";
      case "PROJECT_NOT_FOUND":
        return "The selected project does not exist.";
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

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const {
    projects,
    getTaskBySlug,
    updateTask,
    deleteTask,
    isLoadingTasks,
    isLoadingProjects,
  } = useAppData();
  const task = getTaskBySlug(slug);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<EditTaskFormData>({
    title: "",
    projectId: "",
    assignee: "",
    dueDate: "",
    priority: "Medium",
    status: "To Do",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  function openModal() {
    if (!task) {
      return;
    }

    setForm(taskToFormData(task));
    setErrors({});
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setErrors({});
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!task) {
      return;
    }

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    setFormError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const previousStatus = task.status;
    const updatedTitle = form.title.trim();
    const updatedStatus = form.status;

    setIsSaving(true);

    try {
      const updated = await updateTask(task.slug, {
        title: updatedTitle,
        projectId: form.projectId,
        assignee: form.assignee,
        dueDate: form.dueDate,
        priority: form.priority,
        status: updatedStatus,
      });
      notifyTaskUpdated(
        updated.title,
        updated.slug,
        previousStatus,
        updated.status,
      );
      setIsModalOpen(false);
      setErrors({});
      setFormError("");
    } catch (error) {
      setFormError(toFormErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);
    setDeleteError("");
  }

  async function handleConfirmDelete() {
    if (!task || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteTask(task.slug);
      markTaskDeleteSuccess();
      router.push("/tasks");
    } catch (error) {
      setDeleteError(toFormErrorMessage(error));
      setIsDeleting(false);
    }
  }

  if (isLoadingTasks || isLoadingProjects) {
    return (
      <main className={styles.container}>
        <Link href="/tasks" className={styles.backLink}>
          ← Back to Tasks
        </Link>
        <p className={styles.metaValue}>Loading task…</p>
      </main>
    );
  }

  if (!task) {
    return (
      <main className={styles.container}>
        <Link href="/tasks" className={styles.backLink}>
          ← Back to Tasks
        </Link>
        <h1 className={styles.notFoundTitle}>Task not found</h1>
        <p className={styles.notFoundMessage}>
          The task you&apos;re looking for doesn&apos;t exist.
        </p>
      </main>
    );
  }

  return (
    <>
      <main className={styles.container}>
        <Link href="/tasks" className={styles.backLink}>
          ← Back to Tasks
        </Link>

        <div className={styles.detailsHeader}>
          <div className={styles.titleRow}>
            <div className={styles.titleGroup}>
              <h1 className={styles.title}>{task.title}</h1>
              <span
                className={`${styles.badge} ${statusBadgeClass[task.status]}`}
              >
                {task.status}
              </span>
            </div>

            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.editButton}
                onClick={openModal}
              >
                Edit Task
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => {
                  setDeleteError("");
                  setIsDeleteModalOpen(true);
                }}
              >
                Delete Task
              </button>
            </div>
          </div>

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Project</span>
              <Link
                href={`/projects/${task.projectSlug}`}
                className={styles.navLink}
              >
                {task.projectName}
              </Link>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Client</span>
              <Link
                href={`/clients/${task.clientSlug}`}
                className={styles.navLink}
              >
                {task.clientName}
              </Link>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Assignee</span>
              <span className={styles.metaValue}>{task.assignee}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Due Date</span>
              <span className={styles.metaValue}>
                {formatTaskDueDate(task.dueDate)}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Priority</span>
              <span
                className={`${styles.badge} ${priorityBadgeClass[task.priority]}`}
              >
                {task.priority}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Status</span>
              <span
                className={`${styles.badge} ${statusBadgeClass[task.status]}`}
              >
                {task.status}
              </span>
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className={styles.backdrop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-task-title"
            className={styles.modal}
          >
            <h2 id="edit-task-title" className={styles.modalTitle}>
              Edit Task
            </h2>

            <form className={styles.form} onSubmit={handleSubmit}>
              {formError ? (
                <p className={styles.error} role="alert">
                  {formError}
                </p>
              ) : null}

              <div className={styles.field}>
                <label htmlFor="edit-task-name" className={styles.label}>
                  Task Name *
                </label>
                <input
                  id="edit-task-name"
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
                    errors.title ? "edit-task-name-error" : undefined
                  }
                />
                {errors.title && (
                  <p id="edit-task-name-error" className={styles.error}>
                    {errors.title}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-task-project" className={styles.label}>
                  Project *
                </label>
                <select
                  id="edit-task-project"
                  className={styles.select}
                  value={form.projectId}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      projectId: event.target.value,
                    }))
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.projectId)}
                  aria-describedby={
                    errors.projectId ? "edit-task-project-error" : undefined
                  }
                >
                  <option value="">Select a project</option>
                  {projects.map((projectOption) => (
                    <option key={projectOption.id} value={projectOption.id}>
                      {projectOption.name}
                    </option>
                  ))}
                </select>
                {errors.projectId && (
                  <p id="edit-task-project-error" className={styles.error}>
                    {errors.projectId}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-task-assignee" className={styles.label}>
                  Assignee *
                </label>
                <select
                  id="edit-task-assignee"
                  className={styles.select}
                  value={form.assignee}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      assignee: event.target.value,
                    }))
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.assignee)}
                  aria-describedby={
                    errors.assignee ? "edit-task-assignee-error" : undefined
                  }
                >
                  <option value="">Select an assignee</option>
                  {assigneeOptions.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>
                {errors.assignee && (
                  <p id="edit-task-assignee-error" className={styles.error}>
                    {errors.assignee}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-task-due-date" className={styles.label}>
                  Due Date *
                </label>
                <input
                  id="edit-task-due-date"
                  type="date"
                  className={styles.input}
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      dueDate: event.target.value,
                    }))
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.dueDate)}
                  aria-describedby={
                    errors.dueDate ? "edit-task-due-date-error" : undefined
                  }
                />
                {errors.dueDate && (
                  <p id="edit-task-due-date-error" className={styles.error}>
                    {errors.dueDate}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-task-priority" className={styles.label}>
                  Priority *
                </label>
                <select
                  id="edit-task-priority"
                  className={styles.select}
                  value={form.priority}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      priority: event.target.value as TaskPriority,
                    }))
                  }
                  disabled={isSaving}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-task-status" className={styles.label}>
                  Status *
                </label>
                <select
                  id="edit-task-status"
                  className={styles.select}
                  value={form.status}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      status: event.target.value as TaskStatus,
                    }))
                  }
                  disabled={isSaving}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
              </div>

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
                >
                  {isSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className={styles.backdrop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
            className={styles.modal}
          >
            <h2 id="delete-task-title" className={styles.modalTitle}>
              Delete Task
            </h2>

            <p className={styles.confirmMessage}>
              Are you sure you want to delete &quot;{task.title}&quot;?
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
              >
                {isDeleting ? "Deleting…" : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
