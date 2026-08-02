import AppLayout from "../components/layout/AppLayout";
import styles from "./page.module.css";

export default function Home() {
  return (
    <AppLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Welcome to Avexa Workspace 🚀
        </p>
      </div>
    </AppLayout>
  );
}