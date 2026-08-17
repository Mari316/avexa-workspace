"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAppData, type TaskView } from "../../../context/AppDataContext";
import { usePermission } from "../../../lib/auth/use-permission";
import { ApiError } from "../../../lib/api/request";
import { consumeDeleteSuccessMessage } from "../../../lib/deletedTasks";
import { notifyTaskCreated } from "../../../lib/mockNotifications";
import {
  formatTaskDueDate,
  type TaskPriority,
  type TaskStatus,
} from "../../../lib/mockData";

import styles from "./page.module.css";

type TaskAssignee = "Mari" | "Chris" | "Alex";

type TaskFilters = {
  search: string;
  clientId: string;
  priority: string;
  status: string;
};

const defaultFilters: TaskFilters = {
  search: "",
  clientId: "",
  priority: "",
  status: "",
};

const priorityOptions: TaskPriority[] = ["Low", "Medium", "High"];

const statusOptions: TaskStatus[] = [
  "To Do",
  "In Progress",
  "Review",
  "Blocked",
  "Done",
];

type TaskFormData = {
  title: string;
  clientId: string;
  projectId: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
};

type FormErrors = {
  title?: string;
  clientId?: string;
  projectId?: string;
  assignee?: string;
  dueDate?: string;
};

const assigneeOptions: TaskAssignee[] = ["Mari", "Chris", "Alex"];

function filterTasks(tasks: TaskView[], filters: TaskFilters): TaskView[] {
  const query = filters.search.trim().toLowerCase();

  return tasks.filter((task) => {
    if (filters.clientId && task.clientId !== filters.clientId) {
      return false;
    }

    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }

    if (filters.status && task.status !== filters.status) {
      return false;
    }

    if (query) {
      const matchesSearch = [
        task.title,
        task.projectName,
        task.clientName,
        task.assignee,
      ].some((value) => value.toLowerCase().includes(query));

      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });
}

function formatResultCount(count: number): string {
  return count === 1 ? "1 task" : `${count} tasks`;
}

function hasActiveFilters(filters: TaskFilters): boolean {
  return Boolean(
    filters.search.trim() ||
      filters.clientId ||
      filters.priority ||
      filters.status,
  );
}

const emptyForm: TaskFormData = {
  title: "",
  clientId: "",
  projectId: "",
  assignee: "",
  dueDate: "",
  priority: "Medium",
  status: "To Do",
};

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

function validateForm(form: TaskFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Task name is required.";
  }

  if (!form.clientId) {
    errors.clientId = "Client is required.";
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

export default function TasksPage() {
  const {
    clients,
    tasks,
    isLoadingTasks,
    tasksError,
    addTask,
    getProjectsByClientId,
  } = useAppData();
  const canCreateTask = usePermission("tasks:create");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<TaskFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!consumeDeleteSuccessMessage()) {
      return;
    }

    setShowSuccessBanner(true);

    const timer = window.setTimeout(() => {
      setShowSuccessBanner(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredTasks = useMemo(
    () => filterTasks(tasks, filters),
    [tasks, filters],
  );

  const filtersActive = hasActiveFilters(filters);

  const projectOptions = form.clientId
    ? getProjectsByClientId(form.clientId)
    : [];

  function clearFilters() {
    setFilters(defaultFilters);
  }

  function openModal() {
    setForm(emptyForm);
    setErrors({});
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    setFormError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      const created = await addTask({
        title: form.title.trim(),
        projectId: form.projectId,
        assignee: form.assignee,
        dueDate: form.dueDate,
        priority: form.priority,
        status: form.status,
      });
      notifyTaskCreated(created.title, created.slug);
      setIsModalOpen(false);
      setForm(emptyForm);
      setErrors({});
      setFormError("");
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
            <h1 className={styles.title}>Tasks</h1>
            <p className={styles.subtitle}>
              Track QA work across client projects.
            </p>
          </div>

          {canCreateTask && (
            <button
              type="button"
              className={styles.addButton}
              onClick={openModal}
            >
              + Add Task
            </button>
          )}
        </div>

        {showSuccessBanner && (
          <div className={styles.successBanner} role="status">
            Task deleted successfully
          </div>
        )}

        {tasksError ? (
          <p className={styles.error} role="alert">
            {tasksError}
          </p>
        ) : null}

        <div className={styles.controls}>
          <div className={styles.controlsRow}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(event) =>
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  search: event.target.value,
                }))
              }
              aria-label="Search tasks"
            />

            <select
              className={styles.filterSelect}
              value={filters.clientId}
              onChange={(event) =>
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  clientId: event.target.value,
                }))
              }
              aria-label="Filter by client"
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={filters.priority}
              onChange={(event) =>
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  priority: event.target.value,
                }))
              }
              aria-label="Filter by priority"
            >
              <option value="">All Priorities</option>
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={filters.status}
              onChange={(event) =>
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  status: event.target.value,
                }))
              }
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={styles.clearButton}
              onClick={clearFilters}
              disabled={!filtersActive}
            >
              Clear Filters
            </button>
          </div>

          <p className={styles.resultCount}>
            {formatResultCount(filteredTasks.length)}
          </p>
        </div>

        <div className={styles.card}>
          {isLoadingTasks ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Loading tasks…</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No tasks found</p>
              <p className={styles.emptyHint}>
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td className={styles.taskTitle}>{task.title}</td>
                    <td className={styles.secondaryText}>{task.projectName}</td>
                    <td className={styles.secondaryText}>{task.clientName}</td>
                    <td className={styles.secondaryText}>{task.assignee}</td>
                    <td className={styles.secondaryText}>
                      {formatTaskDueDate(task.dueDate)}
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${priorityBadgeClass[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${statusBadgeClass[task.status]}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/tasks/${task.slug}`}
                        className={styles.viewAction}
                        aria-label={`View ${task.title}`}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className={styles.backdrop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-task-title"
            className={styles.modal}
          >
            <h2 id="add-task-title" className={styles.modalTitle}>
              Add Task
            </h2>

            <form className={styles.form} onSubmit={handleSubmit}>
              {formError ? (
                <p className={styles.error} role="alert">
                  {formError}
                </p>
              ) : null}

              <div className={styles.field}>
                <label htmlFor="task-name" className={styles.label}>
                  Task Name *
                </label>
                <input
                  id="task-name"
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
                  aria-describedby={errors.title ? "task-name-error" : undefined}
                />
                {errors.title && (
                  <p id="task-name-error" className={styles.error}>
                    {errors.title}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="task-client" className={styles.label}>
                  Client *
                </label>
                <select
                  id="task-client"
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
                    errors.clientId ? "task-client-error" : undefined
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
                  <p id="task-client-error" className={styles.error}>
                    {errors.clientId}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="task-project" className={styles.label}>
                  Project *
                </label>
                <select
                  id="task-project"
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
                    errors.projectId ? "task-project-error" : undefined
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
                  <p id="task-project-error" className={styles.error}>
                    {errors.projectId}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="task-assignee" className={styles.label}>
                  Assignee *
                </label>
                <select
                  id="task-assignee"
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
                    errors.assignee ? "task-assignee-error" : undefined
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
                  <p id="task-assignee-error" className={styles.error}>
                    {errors.assignee}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="task-due-date" className={styles.label}>
                  Due Date *
                </label>
                <input
                  id="task-due-date"
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
                    errors.dueDate ? "task-due-date-error" : undefined
                  }
                />
                {errors.dueDate && (
                  <p id="task-due-date-error" className={styles.error}>
                    {errors.dueDate}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="task-priority" className={styles.label}>
                  Priority *
                </label>
                <select
                  id="task-priority"
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
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="task-status" className={styles.label}>
                  Status *
                </label>
                <select
                  id="task-status"
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
                  {isSaving ? "Saving…" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
