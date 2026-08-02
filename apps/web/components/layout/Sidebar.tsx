import styles from "./Sidebar.module.css";

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>Avexa</div>

      <nav className={styles.menu}>
        <div className={`${styles.item} ${styles.active}`}>Dashboard</div>
        <div className={styles.item}>Clients</div>
        <div className={styles.item}>Projects</div>
        <div className={styles.item}>Tasks</div>
        <div className={styles.item}>Contacts</div>
        <div className={styles.item}>Resources</div>
        <div className={styles.item}>Notes</div>
        <div className={styles.item}>Team</div>
        <div className={styles.item}>Audit Log</div>
        <div className={styles.item}>Settings</div>
      </nav>

      <div className={styles.spacer} />

      <div className={styles.footer}>
        Mari Astapova
      </div>
      </aside>
  );
}