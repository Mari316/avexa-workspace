import { Bell, Settings, UserCircle } from "lucide-react";
import SearchBar from "../common/SearchBar";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>Avexa Workspace</div>

      <SearchBar />

      <div className={styles.right}>
        <button className={styles.iconButton} aria-label="Notifications">
          <Bell size={20} />
        </button>

        <button className={styles.iconButton} aria-label="Settings">
          <Settings size={20} />
        </button>

        <div className={styles.profile}>
          <UserCircle size={28} />
          <span>Mari</span>
        </div>
      </div>
    </header>
  );
}