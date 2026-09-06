"use client";

import { useEffect, useState } from "react";
import {
  Users,
  FolderKanban,
  CheckSquare,
  StickyNote,
} from "lucide-react";

import UpcomingDeadlines from "../../components/dashboard/UpcomingDeadlines";
import StatsCard from "../../components/dashboard/StatsCard";
import RecentTasks from "../../components/dashboard/RecentTasks";
import { getDashboard, type DashboardDTO } from "../../lib/api/dashboard";
import { ApiError } from "../../lib/api/request";
import { authClient } from "../../lib/auth-client";

import styles from "./page.module.css";

function displayFirstName(name: string): string {
  const first = name.trim().split(/\s+/)[0];

  return first || name;
}

function toDashboardErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "UNAUTHORIZED":
        return "Sign in to view the dashboard.";
      case "FORBIDDEN":
        return "You do not have permission to view the dashboard.";
      case "NETWORK_ERROR":
        return "Unable to reach the server. Please try again.";
      default:
        return "Unable to load the dashboard. Please refresh the page.";
    }
  }

  return "Unable to load the dashboard. Please refresh the page.";
}

export default function Home() {
  const { data: session } = authClient.useSession();
  const firstName = session?.user?.name
    ? displayFirstName(session.user.name)
    : "…";
  const [dashboard, setDashboard] = useState<DashboardDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getDashboard()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setDashboard(data);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (cancelled) {
          return;
        }

        setDashboard(null);
        setError(toDashboardErrorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Welcome back, {firstName} 👋</h1>

      <p className={styles.subtitle}>
        Here&apos;s what&apos;s happening in Avexa today.
      </p>

      {isLoading ? (
        <p className={styles.status}>Loading dashboard…</p>
      ) : error ? (
        <p className={styles.loadError} role="alert">
          {error}
        </p>
      ) : dashboard ? (
        <>
          <div className={styles.grid}>
            <StatsCard
              icon={<Users size={28} />}
              title="Clients"
              value={String(dashboard.totals.clients)}
              subtitle={`${dashboard.totals.activeClients} active`}
              href="/clients"
            />

            <StatsCard
              icon={<FolderKanban size={28} />}
              title="Projects"
              value={String(dashboard.totals.projects)}
              subtitle={`${dashboard.totals.activeProjects} active`}
              href="/projects"
            />

            <StatsCard
              icon={<CheckSquare size={28} />}
              title="Tasks"
              value={String(dashboard.totals.tasks)}
              subtitle={`${dashboard.totals.overdueTasks} overdue`}
              href="/tasks"
            />

            <StatsCard
              icon={<StickyNote size={28} />}
              title="Notes"
              value={String(dashboard.totals.notes)}
              subtitle={`${dashboard.totals.pinnedNotes} pinned`}
              href="/notes"
            />
          </div>

          <div className={styles.bottomGrid}>
            <RecentTasks tasks={dashboard.recentTasks} />
            <UpcomingDeadlines tasks={dashboard.upcomingDueTasks} />
          </div>
        </>
      ) : null}
    </main>
  );
}
