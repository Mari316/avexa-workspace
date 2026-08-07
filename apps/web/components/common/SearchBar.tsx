import { Search } from "lucide-react";
import styles from "./SearchBar.module.css";

export default function SearchBar() {
  return (
    <div className={styles.container}>
      <Search size={18} className={styles.icon} />

      <input
        className={styles.input}
        type="text"
        placeholder="Search clients, projects, tasks..."
      />
    </div>
  );
}