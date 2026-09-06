"use client";

import { useEffect, useState } from "react";

import {
  getAuditLog,
  type AuditEventDTO,
} from "../../../lib/api/audit-log";
import { ApiError } from "../../../lib/api/request";
import { requireCssClass } from "../../../lib/css-class";

import styles from "./page.module.css";

type AuditAction = AuditEventDTO["action"];
type AuditEntityType = AuditEventDTO["entityType"];

const ACTION_OPTIONS: AuditAction[] = ["Created", "Updated", "Deleted"];

const ENTITY_OPTIONS: AuditEntityType[] = [
  "Client",
  "Contact",
  "Project",
  "Task",
  "Note",
];

const ACTION_QUERY: Record<AuditAction, "created" | "updated" | "deleted"> = {
  Created: "created",
  Updated: "updated",
  Deleted: "deleted",
};

const ENTITY_QUERY: Record<
  AuditEntityType,
  "client" | "contact" | "project" | "task" | "note"
> = {
  Client: "client",
  Contact: "contact",
  Project: "project",
  Task: "task",
  Note: "note",
};

const actionBadgeClass: Record<AuditAction, string> = {
  Created: requireCssClass(styles.actionCreated),
  Updated: requireCssClass(styles.actionUpdated),
  Deleted: requireCssClass(styles.actionDeleted),
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function toAuditErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "UNAUTHORIZED":
        return "Sign in to view the audit log.";
      case "FORBIDDEN":
        return "You do not have permission to view the audit log.";
      case "NETWORK_ERROR":
        return "Unable to reach the server. Please try again.";
      default:
        return "Unable to load the audit log. Please refresh the page.";
    }
  }

  return "Unable to load the audit log. Please refresh the page.";
}

export default function AuditLogPage() {
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [events, setEvents] = useState<AuditEventDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const filtersActive = Boolean(appliedSearch || action || entityType);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAppliedSearch(searchInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError("");

    getAuditLog({
      q: appliedSearch || undefined,
      action: action ? ACTION_QUERY[action as AuditAction] : undefined,
      entityType: entityType
        ? ENTITY_QUERY[entityType as AuditEntityType]
        : undefined,
    })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setEvents(data);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (cancelled) {
          return;
        }

        setEvents([]);
        setError(toAuditErrorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [appliedSearch, action, entityType]);

  function clearFilters() {
    setSearchInput("");
    setAppliedSearch("");
    setAction("");
    setEntityType("");
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Audit Log</h1>
        <p className={styles.subtitle}>
          Track important activity across the workspace.
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlsRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search audit log..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search audit log"
          />

          <select
            className={styles.filterSelect}
            value={action}
            onChange={(event) => setAction(event.target.value)}
            aria-label="Filter by action"
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
            aria-label="Filter by entity"
          >
            <option value="">All Entities</option>
            {ENTITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={styles.clearButton}
            onClick={clearFilters}
            disabled={!filtersActive && !searchInput.trim()}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className={styles.status}>Loading audit log…</p>
      ) : error ? (
        <p className={styles.loadError} role="alert">
          {error}
        </p>
      ) : (
        <>
          <p className={styles.resultCount}>
            Showing {events.length} {events.length === 1 ? "event" : "events"}
          </p>

          <div className={styles.card}>
            {events.length === 0 ? (
              <div className={styles.emptyState}>
                {filtersActive ? (
                  <>
                    <p className={styles.emptyTitle}>
                      No audit events match your filters.
                    </p>
                    <p className={styles.emptyHint}>
                      Try adjusting your search or filters.
                    </p>
                  </>
                ) : (
                  <p className={styles.emptyTitle}>No audit events yet.</p>
                )}
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className={styles.dateTime}>
                        {formatDateTime(event.createdAt)}
                      </td>
                      <td className={styles.userName}>{event.actorName}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${actionBadgeClass[event.action]}`}
                        >
                          {event.action}
                        </span>
                      </td>
                      <td className={styles.secondaryText}>
                        {event.entityType}
                      </td>
                      <td className={styles.detailsText}>{event.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </main>
  );
}
