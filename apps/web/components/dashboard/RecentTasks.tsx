import type { DashboardTaskItem } from "../../lib/api/dashboard";
import { formatTaskDueDate } from "../../lib/mockData";

import styles from "./RecentTasks.module.css";

type RecentTasksProps = {
  tasks: DashboardTaskItem[];
};

export default function RecentTasks({ tasks }: RecentTasksProps) {
  return (
    <div className={styles.card}>
      <h2>Recent Tasks</h2>

      {tasks.length === 0 ? (
        <p className={styles.empty}>No recent tasks.</p>
      ) : (
        tasks.map((task) => (
          <div className={styles.task} key={task.slug}>
            <div className={styles.info}>
              <div className={styles.title}>{task.title}</div>
              <div className={styles.project}>{task.projectName}</div>
            </div>

            <div className={styles.due}>{formatTaskDueDate(task.dueDate)}</div>
          </div>
        ))
      )}
    </div>
  );
}
