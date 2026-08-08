"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import AppLayout from "../../components/layout/AppLayout";
import {
  consumeDeleteSuccessMessage,
  filterDeletedTasks,
} from "../../lib/deletedTasks";
import {
  clientProjects,
  getTaskSlug,
  tasks as initialTasks,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../../lib/mockData";

import styles from "./page.module.css";

type TaskClient = "Pax8" | "Cybertek" | "OrangeHRM" | "Lemonade";

type TaskAssignee = "Mari" | "Chris" | "Alex";

type TaskFormData = {
  title: string;
  client: string;
  project: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
};

type FormErrors = {
  title?: string;
  client?: string;
  project?: string;
  assignee?: string;
  dueDate?: string;
};

const clientOptions: TaskClient[] = [
  "Pax8",
  "Cybertek",
  "OrangeHRM",
  "Lemonade",
];

const assigneeOptions: TaskAssignee[] = ["Mari", "Chris", "Alex"];

const emptyForm: TaskFormData = {
  title: "",
  client: "",
  project: "",
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

function formatDueDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function validateForm(form: TaskFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Task name is required.";
  }

  if (!form.client) {
    errors.client = "Client is required.";
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(() =>
    filterDeletedTasks(initialTasks),
  );
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<TaskFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!consumeDeleteSuccessMessage()) {
      return;
    }

    setTasks(filterDeletedTasks(initialTasks));
    setShowSuccessBanner(true);

    const timer = window.setTimeout(() => {
      setShowSuccessBanner(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, []);

  const projectOptions = form.client
    ? clientProjects[form.client as TaskClient] ?? []
    : [];

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

    const newTask: Task = {
      id: `task-${Date.now()}`,
      slug: getTaskSlug(form.title.trim()),
      title: form.title.trim(),
      project: form.project,
      client: form.client,
      assignee: form.assignee,
      dueDate: formatDueDate(form.dueDate),
      priority: form.priority,
      status: form.status,
    };

    setTasks((currentTasks) => [...currentTasks, newTask]);
    closeModal();
  }

  return (
    <AppLayout>
      <main className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Tasks</h1>
            <p className={styles.subtitle}>
              Track QA work across client projects.
            </p>
          </div>

          <button
            type="button"
            className={styles.addButton}
            onClick={openModal}
          >
            + Add Task
          </button>
        </div>

        {showSuccessBanner && (
          <div className={styles.successBanner} role="status">
            Task deleted successfully
          </div>
        )}

        <div className={styles.card}>
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
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className={styles.taskTitle}>{task.title}</td>
                  <td className={styles.secondaryText}>{task.project}</td>
                  <td className={styles.secondaryText}>{task.client}</td>
                  <td className={styles.secondaryText}>{task.assignee}</td>
                  <td className={styles.secondaryText}>{task.dueDate}</td>
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
                    errors.client ? "task-client-error" : undefined
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
                  <p id="task-client-error" className={styles.error}>
                    {errors.client}
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
                    errors.project ? "task-project-error" : undefined
                  }
                >
                  <option value="">
                    {form.client
                      ? "Select a project"
                      : "Select a client first"}
                  </option>
                  {projectOptions.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
                {errors.project && (
                  <p id="task-project-error" className={styles.error}>
                    {errors.project}
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
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
