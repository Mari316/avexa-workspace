"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useAppData } from "../../../context/AppDataContext";
import {
  formatContactName,
  resolveClientPrimaryContact,
} from "../../../lib/mockData";

import styles from "./page.module.css";

export default function ClientDetailsPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const {
    contacts,
    getClientBySlug,
    getProjectsByClientId,
    getContactsByClientId,
    isLoadingClients,
    isLoadingContacts,
    isLoadingProjects,
    isLoadingTasks,
    tasks,
  } = useAppData();
  const client = getClientBySlug(slug);

  // Relationship lists are only meaningful once related API loads finish.
  if (
    isLoadingClients ||
    isLoadingContacts ||
    isLoadingProjects ||
    isLoadingTasks
  ) {
    return (
      <main className={styles.container}>
        <Link href="/clients" className={styles.backLink}>
          ← Back to Clients
        </Link>
        <p className={styles.emptyState}>Loading client…</p>
      </main>
    );
  }

  if (!client) {
    return (
      <main className={styles.container}>
        <Link href="/clients" className={styles.backLink}>
          ← Back to Clients
        </Link>
        <h1 className={styles.notFoundTitle}>Client not found</h1>
        <p className={styles.notFoundMessage}>
          The client you&apos;re looking for doesn&apos;t exist.
        </p>
      </main>
    );
  }

  const clientProjects = getProjectsByClientId(client.id);
  const clientContacts = getContactsByClientId(client.id);
  const primaryContact = resolveClientPrimaryContact(client, contacts);

  return (
    <main className={styles.container}>
      <Link href="/clients" className={styles.backLink}>
        ← Back to Clients
      </Link>

      <div className={styles.detailsHeader}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{client.name}</h1>
          <span
            className={`${styles.badge} ${
              client.status === "Active"
                ? styles.badgeActive
                : styles.badgeOnHold
            }`}
          >
            {client.status}
          </span>
        </div>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Primary Contact</span>
            <span className={styles.metaValue}>
              {primaryContact
                ? formatContactName(
                    primaryContact.firstName,
                    primaryContact.lastName,
                  )
                : "—"}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Contact Email</span>
            <span className={styles.metaValue}>
              {primaryContact?.email ?? "—"}
            </span>
          </div>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Projects</h2>
        <div className={styles.card}>
          {clientProjects.length === 0 ? (
            <p className={styles.emptyState}>No projects for this client.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Environment</th>
                  <th>Tasks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clientProjects.map((project) => (
                  <tr key={project.id}>
                    <td className={styles.primaryName}>
                      <Link
                        href={`/projects/${project.slug}`}
                        className={styles.projectLink}
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className={styles.secondaryText}>
                      {project.environment}
                    </td>
                    <td className={styles.secondaryText}>
                      {
                        tasks.filter((task) => task.projectId === project.id)
                          .length
                      }
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          project.status === "Active"
                            ? styles.badgeActive
                            : styles.badgeOnHold
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Contacts</h2>
        <div className={styles.card}>
          {clientContacts.length === 0 ? (
            <p className={styles.emptyState}>No contacts for this client.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clientContacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className={styles.primaryName}>
                      {formatContactName(contact.firstName, contact.lastName)}
                    </td>
                    <td className={styles.secondaryText}>{contact.email}</td>
                    <td className={styles.secondaryText}>{contact.role}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          contact.status === "Active"
                            ? styles.badgeActive
                            : styles.badgeInactive
                        }`}
                      >
                        {contact.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
