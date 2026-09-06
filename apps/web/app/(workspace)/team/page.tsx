"use client";

import { useEffect, useState } from "react";

import { getTeam, type TeamMemberDTO } from "../../../lib/api/team";
import { ApiError } from "../../../lib/api/request";
import { authClient } from "../../../lib/auth-client";
import type { Role } from "../../../lib/auth/permissions";

import styles from "./page.module.css";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  qa_engineer: "QA Engineer",
  viewer: "Viewer",
};

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "UNAUTHORIZED":
        return "Sign in to view the team.";
      case "NETWORK_ERROR":
        return "Unable to reach the server. Please try again.";
      default:
        return "Unable to load the team. Please refresh the page.";
    }
  }

  return "Unable to load the team. Please refresh the page.";
}

export default function TeamPage() {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const [members, setMembers] = useState<TeamMemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getTeam()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setMembers(data);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (cancelled) {
          return;
        }

        setMembers([]);
        setError(toErrorMessage(loadError));
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
      <div className={styles.header}>
        <h1 className={styles.title}>Team</h1>
        <p className={styles.subtitle}>
          People who can sign in to this workspace.
        </p>
      </div>

      {isLoading ? (
        <p className={styles.status}>Loading team…</p>
      ) : error ? (
        <p className={styles.loadError} role="alert">
          {error}
        </p>
      ) : members.length === 0 ? (
        <p className={styles.emptyState}>No team members yet.</p>
      ) : (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td className={styles.memberName}>
                    {member.name}
                    {member.id === currentUserId ? (
                      <span className={styles.youBadge}>You</span>
                    ) : null}
                  </td>
                  <td className={styles.secondaryText}>{member.email}</td>
                  <td className={styles.secondaryText}>
                    {ROLE_LABELS[member.role]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
