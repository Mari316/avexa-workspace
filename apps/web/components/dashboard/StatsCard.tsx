"use client";

import Link from "next/link";
import { ReactNode } from "react";

import styles from "./StatsCard.module.css";

type StatsCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
  href: string;
};

export default function StatsCard({
  icon,
  title,
  value,
  subtitle,
  href,
}: StatsCardProps) {
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.icon}>{icon}</div>

      <div className={styles.title}>{title}</div>

      <div className={styles.value}>{value}</div>

      <div className={styles.subtitle}>{subtitle}</div>
    </Link>
  );
}
