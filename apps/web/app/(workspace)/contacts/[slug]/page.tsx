"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useAppData } from "../../../../context/AppDataContext";
import { formatContactName } from "../../../../lib/mockData";

import styles from "./page.module.css";

export default function ContactDetailsPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const { getContactBySlug, isLoadingContacts } = useAppData();
  const contact = getContactBySlug(slug);

  if (isLoadingContacts) {
    return (
      <main className={styles.container}>
        <Link href="/contacts" className={styles.backLink}>
          ← Back to Contacts
        </Link>
        <p className={styles.notFoundMessage}>Loading contact…</p>
      </main>
    );
  }

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
            <Link
              href={`/clients/${contact.clientSlug}`}
              className={styles.clientLink}
            >
              {contact.clientName}
            </Link>
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
