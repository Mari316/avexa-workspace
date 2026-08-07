"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./Sidebar.module.css";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Clients", href: "/clients" },
  { label: "Projects", href: "/projects" },
  { label: "Tasks", href: "/tasks" },
  { label: "Contacts", href: "/contacts" },
  { label: "Resources", href: "/resources" },
  { label: "Notes", href: "/notes" },
  { label: "Team", href: "/team" },
  { label: "Audit Log", href: "/audit-log" },
  { label: "Settings", href: "/settings" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>Avexa</div>

      <nav className={styles.menu}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.item} ${
              isActive(pathname, item.href) ? styles.active : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.spacer} />

      <div className={styles.footer}>Mari Astapova</div>
    </aside>
  );
}
