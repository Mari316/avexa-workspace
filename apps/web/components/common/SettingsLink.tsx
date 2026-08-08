"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

import headerStyles from "../layout/Header.module.css";

export default function SettingsLink() {
  return (
    <Link
      href="/settings"
      className={headerStyles.iconButton}
      aria-label="Settings"
    >
      <Settings size={20} />
    </Link>
  );
}
