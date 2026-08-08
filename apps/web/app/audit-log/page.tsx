"use client";

import { useMemo, useState } from "react";


import styles from "./page.module.css";

type AuditAction = "Created" | "Updated" | "Deleted" | "Login" | "Exported";

type AuditEntity =
  | "Client"
  | "Project"
  | "Task"
  | "Contact"
  | "Resource"
  | "Note"
  | "Team Member"
  | "Workspace";

type AuditStatus = "Success" | "Failed";

type AuditRecord = {
  id: string;
  sortKey: number;
  dateTime: string;
  user: string;
  action: AuditAction;
  entity: AuditEntity;
  details: string;
  status: AuditStatus;
};

type AuditFilters = {
  search: string;
  action: string;
  entity: string;
  status: string;
};

const defaultFilters: AuditFilters = {
  search: "",
  action: "",
  entity: "",
  status: "",
};

const actionOptions: AuditAction[] = [
  "Created",
  "Updated",
  "Deleted",
  "Login",
  "Exported",
];

const entityOptions: AuditEntity[] = [
  "Client",
  "Project",
  "Task",
  "Contact",
  "Resource",
  "Note",
  "Team Member",
  "Workspace",
];

const statusOptions: AuditStatus[] = ["Success", "Failed"];

const actionBadgeClass: Record<AuditAction, string> = {
  Created: styles.actionCreated,
  Updated: styles.actionUpdated,
  Deleted: styles.actionDeleted,
  Login: styles.actionLogin,
  Exported: styles.actionExported,
};

const initialAuditRecords: AuditRecord[] = [
  {
    id: "audit-1",
    sortKey: new Date("2026-08-08T10:32:00").getTime(),
    dateTime: "Aug 8, 2026 10:32 AM",
    user: "Mari Astapova",
    action: "Created",
    entity: "Task",
    details: 'Created task "Validate API regression"',
    status: "Success",
  },
  {
    id: "audit-2",
    sortKey: new Date("2026-08-08T10:15:00").getTime(),
    dateTime: "Aug 8, 2026 10:15 AM",
    user: "Mari Astapova",
    action: "Updated",
    entity: "Task",
    details:
      'Changed status of "Finish regression coverage" from To Do to In Progress',
    status: "Success",
  },
  {
    id: "audit-3",
    sortKey: new Date("2026-08-08T09:48:00").getTime(),
    dateTime: "Aug 8, 2026 9:48 AM",
    user: "Chris Miller",
    action: "Updated",
    entity: "Project",
    details: "Updated Partner Portal project",
    status: "Success",
  },
  {
    id: "audit-4",
    sortKey: new Date("2026-08-08T08:20:00").getTime(),
    dateTime: "Aug 8, 2026 8:20 AM",
    user: "Mari Astapova",
    action: "Login",
    entity: "Workspace",
    details: "Signed in to Avexa workspace",
    status: "Success",
  },
  {
    id: "audit-5",
    sortKey: new Date("2026-08-07T16:30:00").getTime(),
    dateTime: "Aug 7, 2026 4:30 PM",
    user: "Alex Brown",
    action: "Deleted",
    entity: "Task",
    details: 'Deleted task "Old login investigation"',
    status: "Success",
  },
  {
    id: "audit-6",
    sortKey: new Date("2026-08-07T14:12:00").getTime(),
    dateTime: "Aug 7, 2026 2:12 PM",
    user: "Mari Astapova",
    action: "Created",
    entity: "Client",
    details: 'Created client "OrangeHRM"',
    status: "Success",
  },
  {
    id: "audit-7",
    sortKey: new Date("2026-08-07T11:05:00").getTime(),
    dateTime: "Aug 7, 2026 11:05 AM",
    user: "Sofia Chen",
    action: "Updated",
    entity: "Resource",
    details: "Updated OrangeHRM test environment",
    status: "Success",
  },
  {
    id: "audit-8",
    sortKey: new Date("2026-08-07T10:40:00").getTime(),
    dateTime: "Aug 7, 2026 10:40 AM",
    user: "Mari Astapova",
    action: "Updated",
    entity: "Resource",
    details: "Failed to update API documentation URL",
    status: "Failed",
  },
  {
    id: "audit-9",
    sortKey: new Date("2026-08-07T09:30:00").getTime(),
    dateTime: "Aug 7, 2026 9:30 AM",
    user: "Alex Brown",
    action: "Created",
    entity: "Note",
    details: 'Created note "Login Bug Findings"',
    status: "Success",
  },
  {
    id: "audit-10",
    sortKey: new Date("2026-08-06T13:00:00").getTime(),
    dateTime: "Aug 6, 2026 1:00 PM",
    user: "Mari Astapova",
    action: "Exported",
    entity: "Task",
    details: "Exported task list to CSV",
    status: "Success",
  },
];

function hasActiveFilters(filters: AuditFilters): boolean {
  return Boolean(
    filters.search.trim() ||
      filters.action ||
      filters.entity ||
      filters.status,
  );
}

function filterAuditRecords(
  records: AuditRecord[],
  filters: AuditFilters,
): AuditRecord[] {
  const query = filters.search.trim().toLowerCase();

  return records.filter((record) => {
    if (filters.action && record.action !== filters.action) {
      return false;
    }

    if (filters.entity && record.entity !== filters.entity) {
      return false;
    }

    if (filters.status && record.status !== filters.status) {
      return false;
    }

    if (query) {
      const matchesSearch = [
        record.user,
        record.action,
        record.entity,
        record.details,
      ].some((value) => value.toLowerCase().includes(query));

      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState<AuditFilters>(defaultFilters);

  const sortedRecords = useMemo(
    () =>
      [...initialAuditRecords].sort((a, b) => b.sortKey - a.sortKey),
    [],
  );

  const filteredRecords = useMemo(
    () => filterAuditRecords(sortedRecords, filters),
    [sortedRecords, filters],
  );

  const filtersActive = hasActiveFilters(filters);

  function clearFilters() {
    setFilters(defaultFilters);
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
              value={filters.search}
              onChange={(event) =>
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  search: event.target.value,
                }))
              }
              aria-label="Search audit log"
            />

            <select
              className={styles.filterSelect}
              value={filters.action}
              onChange={(event) =>
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  action: event.target.value,
                }))
              }
              aria-label="Filter by action"
            >
              <option value="">All Actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={filters.entity}
              onChange={(event) =>
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  entity: event.target.value,
                }))
              }
              aria-label="Filter by entity"
            >
              <option value="">All Entities</option>
              {entityOptions.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={filters.status}
              onChange={(event) =>
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  status: event.target.value,
                }))
              }
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={styles.clearButton}
              onClick={clearFilters}
              disabled={!filtersActive}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <p className={styles.resultCount}>
          Showing {filteredRecords.length} of {sortedRecords.length} events
        </p>

        <div className={styles.card}>
          {filteredRecords.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No audit events found</p>
              <p className={styles.emptyHint}>
                Try adjusting your search or filters.
              </p>
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
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className={styles.dateTime}>{record.dateTime}</td>
                    <td className={styles.userName}>{record.user}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${actionBadgeClass[record.action]}`}
                      >
                        {record.action}
                      </span>
                    </td>
                    <td className={styles.secondaryText}>{record.entity}</td>
                    <td className={styles.detailsText}>{record.details}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          record.status === "Success"
                            ? styles.statusSuccess
                            : styles.statusFailed
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>);
}
