import NotificationsPanel from "../common/NotificationsPanel";
import SearchBar from "../common/SearchBar";
import SettingsLink from "../common/SettingsLink";
import UserMenu from "../common/UserMenu";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>Avexa Workspace</div>

      <SearchBar />

      <div className={styles.right}>
        <NotificationsPanel />
        <SettingsLink />
        <UserMenu />
      </div>
    </header>
  );
}
