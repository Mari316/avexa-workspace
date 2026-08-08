"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useAppData } from "../../../context/AppDataContext";
import { formatContactName } from "../../../lib/mockData";

import styles from "./page.module.css";

export default function ContactDetailsPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const { clients, getContactBySlug } = useAppData();
  const contact = getContactBySlug(slug);

  if (!contact) {
    return (
      <main className={styles.container}>
        <Link href="/contacts" className={styles.backLink}>
          ← Back to Contacts
        </Link>
        <h1 className={styles.notFoundTitle}>Contact not found</h1>
        <p className={styles.notFoundMessage}>
          The contact you&apos;re looking for doesn&apos;t exist.
        </p>
      </main>
    );
  }

  const client = clients.find(
    (currentClient) => currentClient.name === contact.client,
  );

  return (
    <main className={styles.container}>
      <Link href="/contacts" className={styles.backLink}>
        ← Back to Contacts
      </Link>

      <div className={styles.detailsHeader}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            {formatContactName(contact.firstName, contact.lastName)}
          </h1>
          <span
            className={`${styles.badge} ${
              contact.status === "Active"
                ? styles.badgeActive
                : styles.badgeInactive
            }`}
          >
            {contact.status}
          </span>
        </div>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Client</span>
            {client ? (
              <Link href={`/clients/${client.slug}`} className={styles.clientLink}>
                {contact.client}
              </Link>
            ) : (
              <span className={styles.metaValue}>{contact.client}</span>
            )}
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Email</span>
            <span className={styles.metaValue}>{contact.email}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Role</span>
            <span className={styles.metaValue}>{contact.role}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
