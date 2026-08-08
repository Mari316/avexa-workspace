"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import AppLayout from "../../../components/layout/AppLayout";
import {
  getClientSlug,
  getProjectByName,
  getTaskBySlug,
  type TaskPriority,
  type TaskStatus,
} from "../../../lib/mockData";

import styles from "./page.module.css";

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

export default function TaskDetailsPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const task = getTaskBySlug(slug);

  if (!task) {
    return (
      <AppLayout>
        <main className={styles.container}>
          <Link href="/tasks" className={styles.backLink}>
            ← Back to Tasks
          </Link>
          <h1 className={styles.notFoundTitle}>Task not found</h1>
          <p className={styles.notFoundMessage}>
            The task you&apos;re looking for doesn&apos;t exist.
          </p>
        </main>
      </AppLayout>
    );
  }

  const project = getProjectByName(task.project);

  return (
    <AppLayout>
      <main className={styles.container}>
        <Link href="/tasks" className={styles.backLink}>
          ← Back to Tasks
        </Link>

        <div className={styles.detailsHeader}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{task.title}</h1>
            <span
              className={`${styles.badge} ${statusBadgeClass[task.status]}`}
            >
              {task.status}
            </span>
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
              <Link
                href={`/clients/${getClientSlug(task.client)}`}
                className={styles.navLink}
              >
                {task.client}
              </Link>
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
    </AppLayout>
  );
}
