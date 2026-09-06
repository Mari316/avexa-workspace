"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";

import type { DashboardTaskItem } from "../../lib/api/dashboard";
import { formatTaskDueDate } from "../../lib/mockData";

import styles from "./UpcomingDeadlines.module.css";

type UpcomingDueDatesProps = {
  tasks: DashboardTaskItem[];
};

export default function UpcomingDeadlines({ tasks }: UpcomingDueDatesProps) {
  return (
    <div className={styles.card}>
      <div className={styles.heading}>
        <CalendarDays size={22} />
        <h2>Upcoming due dates</h2>
      </div>

      {tasks.length === 0 ? (
        <p className={styles.empty}>No upcoming due dates.</p>
      ) : (
        <div className={styles.list}>
          {tasks.map((task) => (
            <Link
              className={styles.deadline}
              href={`/tasks/${task.slug}`}
              key={task.slug}
            >
              <div className={styles.date}>{formatTaskDueDate(task.dueDate)}</div>

              <div>
                <div className={styles.title}>{task.title}</div>
                <div className={styles.project}>{task.projectName}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
