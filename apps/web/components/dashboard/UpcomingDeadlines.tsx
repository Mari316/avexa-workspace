import { CalendarDays } from "lucide-react";

import styles from "./UpcomingDeadlines.module.css";

const deadlines = [
  {
    date: "Aug 8",
    title: "Regression Demo",
    project: "Pax8",
  },
  {
    date: "Aug 12",
    title: "Sprint Review",
    project: "Cybertek",
  },
  {
    date: "Aug 15",
    title: "Release Validation",
    project: "OrangeHRM",
  },
  {
    date: "Aug 20",
    title: "Client Presentation",
    project: "Lemonade",
  },
];

export default function UpcomingDeadlines() {
  return (
    <div className={styles.card}>
      <div className={styles.heading}>
        <CalendarDays size={22} />
        <h2>Upcoming Deadlines</h2>
      </div>

      <div className={styles.list}>
        {deadlines.map((deadline) => (
          <div className={styles.deadline} key={deadline.title}>
            <div className={styles.date}>{deadline.date}</div>

            <div>
              <div className={styles.title}>{deadline.title}</div>
              <div className={styles.project}>{deadline.project}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}