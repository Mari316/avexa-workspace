import {
  Bug,
  CircleCheck,
  Clock3,
  GitPullRequest,
} from "lucide-react";

import styles from "./RecentTasks.module.css";

const tasks = [
  {
    title: "Finish PAM-1972",
    project: "Pax8",
    due: "Today",
    icon: <CircleCheck size={18} />,
    color: "#22c55e",
  },
  {
    title: "Review PR #481",
    project: "Cybertek",
    due: "Tomorrow",
    icon: <GitPullRequest size={18} />,
    color: "#f59e0b",
  },
  {
    title: "Update Playwright Tests",
    project: "OrangeHRM",
    due: "Aug 5",
    icon: <Clock3 size={18} />,
    color: "#3b82f6",
  },
  {
    title: "Investigate Login Bug",
    project: "Lemonade",
    due: "Yesterday",
    icon: <Bug size={18} />,
    color: "#ef4444",
  },
];

export default function RecentTasks() {
  return (
    <div className={styles.card}>
      <h2>Recent Tasks</h2>

      {tasks.map((task) => (
        <div className={styles.task} key={task.title}>
          <div
            className={styles.icon}
            style={{ color: task.color }}
          >
            {task.icon}
          </div>

          <div className={styles.info}>
            <div className={styles.title}>{task.title}</div>
            <div className={styles.project}>{task.project}</div>
          </div>

          <div className={styles.due}>{task.due}</div>
        </div>
      ))}
    </div>
  );
}