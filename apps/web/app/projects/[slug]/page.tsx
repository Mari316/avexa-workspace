"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import AppLayout from "../../../components/layout/AppLayout";
import {
  getClientSlug,
  getProjectBySlug,
  getTasksByProject,
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

export default function ProjectDetailsPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const project = getProjectBySlug(slug);

  if (!project) {
    return (
      <AppLayout>
        <main className={styles.container}>
          <Link href="/projects" className={styles.backLink}>
            ← Back to Projects
          </Link>
          <h1 className={styles.notFoundTitle}>Project not found</h1>
          <p className={styles.notFoundMessage}>
            The project you&apos;re looking for doesn&apos;t exist.
          </p>
        </main>
      </AppLayout>
    );
  }

  const projectTasks = getTasksByProject(project.name);

  return (
    <AppLayout>
      <main className={styles.container}>
        <Link href="/projects" className={styles.backLink}>
          ← Back to Projects
        </Link>

        <div className={styles.detailsHeader}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{project.name}</h1>
            <span
              className={`${styles.badge} ${
                project.status === "Active"
                  ? styles.badgeActive
                  : styles.badgeOnHold
              }`}
            >
              {project.status}
            </span>
          </div>

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Client</span>
              <Link
                href={`/clients/${getClientSlug(project.client)}`}
                className={styles.clientLink}
              >
                {project.client}
              </Link>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Environment</span>
              <span className={styles.metaValue}>{project.environment}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Task Count</span>
              <span className={styles.metaValue}>{project.taskCount}</span>
            </div>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tasks</h2>
          <div className={styles.card}>
            {projectTasks.length === 0 ? (
              <p className={styles.emptyState}>No tasks for this project.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projectTasks.map((task) => (
                    <tr key={task.id}>
                      <td className={styles.primaryName}>{task.title}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
