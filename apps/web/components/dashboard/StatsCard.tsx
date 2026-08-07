import styles from "./StatsCard.module.css";
import { ReactNode } from "react";

type StatsCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
};

export default function StatsCard({
  icon,
  title,
  value,
  subtitle,
}: StatsCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>{icon}</div>

      <div className={styles.title}>{title}</div>

      <div className={styles.value}>{value}</div>

      <div className={styles.subtitle}>{subtitle}</div>
    </div>
  );
}