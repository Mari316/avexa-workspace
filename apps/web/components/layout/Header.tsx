import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>Avexa Workspace</div>

      <div className={styles.right}>
        <span>Search</span>
        <span>Notifications</span>
        <span>Profile</span>
      </div>
    </header>
  );
}