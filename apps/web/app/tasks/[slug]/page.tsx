"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAppData } from "../../../context/AppDataContext";
import { markTaskDeleteSuccess } from "../../../lib/deletedTasks";
import { notifyTaskUpdated } from "../../../lib/mockNotifications";
import {
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../../../lib/mockData";

import styles from "./page.module.css";

type TaskAssignee = "Mari" | "Chris" | "Alex";

type EditTaskFormData = {
  title: string;
  project: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
};

type FormErrors = {
  title?: string;
  project?: string;
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

function parseDisplayDueDate(displayDate: string): string {
  const parsed = new Date(`${displayDate}, 2026`);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDueDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function validateForm(form: EditTaskFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Task name is required.";
  }

  if (!form.project) {
    errors.project = "Project is required.";
  }

  if (!form.assignee) {
    errors.assignee = "Assignee is required.";
  }

  if (!form.dueDate) {
    errors.dueDate = "Due date is required.";
  }

  return errors;
}

function taskToFormData(task: Task): EditTaskFormData {
  return {
    title: task.title,
    project: task.project,
    assignee: task.assignee,
    dueDate: parseDisplayDueDate(task.dueDate),
    priority: task.priority,
    status: task.status,
  };
}

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const {
    clients,
    projects,
    getTaskBySlug,
    getProjectByName,
    updateTask,
    deleteTask,
  } = useAppData();
  const task = getTaskBySlug(slug);
  const client = task
    ? clients.find((currentClient) => currentClient.name === task.client)
    : undefined;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState<EditTaskFormData>({
    title: "",
    project: "",
    assignee: "",
    dueDate: "",
    priority: "Medium",
    status: "To Do",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  function openModal() {
    if (!task) {
      return;
    }

    setForm(taskToFormData(task));
    setErrors({});
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!task) {
      return;
    }

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const selectedProject = getProjectByName(form.project);
    const previousStatus = task.status;
    const updatedTitle = form.title.trim();
    const updatedStatus = form.status;

    const updatedTask: Task = {
      ...task,
      title: updatedTitle,
      project: form.project,
      client: selectedProject?.client ?? task.client,
      assignee: form.assignee,
      dueDate: formatDueDate(form.dueDate),
      priority: form.priority,
      status: updatedStatus,
    };

    updateTask(task.slug, updatedTask);
    notifyTaskUpdated(
      updatedTitle,
      task.slug,
      previousStatus,
      updatedStatus,
    );
    closeModal();
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);
  }

  function handleConfirmDelete() {
    if (!task || isDeleting) {
      return;
    }

    setIsDeleting(true);
    deleteTask(task.slug);
    markTaskDeleteSuccess();
    router.push("/tasks");
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

  const project = getProjectByName(task.project);

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
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete Task
              </button>
            </div>
          </div>

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Project</span>
              {project ? (
                <Link
                  href={`/projects/${project.slug}`}
                  className={styles.navLink}
                >
                  {task.project}
                </Link>
              ) : (
                <span className={styles.metaValue}>{task.project}</span>
              )}
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Client</span>
              {client ? (
                <Link
                  href={`/clients/${client.slug}`}
                  className={styles.navLink}
                >
                  {task.client}
                </Link>
              ) : (
                <span className={styles.metaValue}>{task.client}</span>
              )}
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Assignee</span>
              <span className={styles.metaValue}>{task.assignee}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Due Date</span>
              <span className={styles.metaValue}>{task.dueDate}</span>
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
                  value={form.project}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      project: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.project)}
                  aria-describedby={
                    errors.project ? "edit-task-project-error" : undefined
                  }
                >
                  <option value="">Select a project</option>
                  {projects.map((projectOption) => (
                    <option key={projectOption.slug} value={projectOption.name}>
                      {projectOption.name}
                    </option>
                  ))}
                </select>
                {errors.project && (
                  <p id="edit-task-project-error" className={styles.error}>
                    {errors.project}
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
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  Save Changes
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
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
