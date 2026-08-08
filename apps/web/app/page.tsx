import {
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
} from "lucide-react";

import UpcomingDeadlines from "../components/dashboard/UpcomingDeadlines";
import StatsCard from "../components/dashboard/StatsCard";
import RecentTasks from "../components/dashboard/RecentTasks";

import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.container}>
        <h1 className={styles.title}>Welcome back, Mari 👋</h1>

        <p className={styles.subtitle}>
          Here's what's happening in Avexa today.
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