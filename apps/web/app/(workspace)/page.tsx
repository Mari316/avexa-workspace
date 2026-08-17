"use client";

import {
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
} from "lucide-react";

import UpcomingDeadlines from "../../components/dashboard/UpcomingDeadlines";
import StatsCard from "../../components/dashboard/StatsCard";
import RecentTasks from "../../components/dashboard/RecentTasks";
import { authClient } from "../../lib/auth-client";

import styles from "./page.module.css";

function displayFirstName(name: string): string {
  const first = name.trim().split(/\s+/)[0];

  return first || name;
}

export default function Home() {
  const { data: session } = authClient.useSession();
  const firstName = session?.user?.name
    ? displayFirstName(session.user.name)
    : "…";

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Welcome back, {firstName} 👋</h1>

      <p className={styles.subtitle}>
        Here&apos;s what&apos;s happening in Avexa today.
      </p>

      <div className={styles.grid}>
        <StatsCard
          icon={<Users size={28} />}
          title="Clients"
          value="12"
          subtitle="+2 this week"
        />

        <StatsCard
          icon={<FolderKanban size={28} />}
          title="Projects"
          value="6"
          subtitle="4 active"
        />

        <StatsCard
          icon={<CheckSquare size={28} />}
          title="Tasks"
          value="28"
          subtitle="9 due today"
        />

        <StatsCard
          icon={<Clock size={28} />}
          title="Hours"
          value="41h"
          subtitle="This week"
        />
      </div>

      <div className={styles.bottomGrid}>
        <RecentTasks />
        <UpcomingDeadlines />
      </div>
    </main>
  );
}
