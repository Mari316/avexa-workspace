"use client";

import Link from "next/link";
import { UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { authClient } from "../../lib/auth-client";
import {
  openHeaderDropdown,
  subscribeHeaderDropdown,
} from "../../lib/headerDropdowns";

import styles from "./UserMenu.module.css";

function displayFirstName(name: string): string {
  const first = name.trim().split(/\s+/)[0];

  return first || name;
}

export default function UserMenu() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { data: session, isPending } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = session?.user;
  const firstName = user ? displayFirstName(user.name) : "…";

  useEffect(() => {
    return subscribeHeaderDropdown((opened) => {
      if (opened === "notifications" || opened === "search") {
        setIsOpen(false);
      }
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  function toggleMenu() {
    setIsOpen((current) => {
      const nextOpen = !current;

      if (nextOpen) {
        openHeaderDropdown("userMenu");
      }

      return nextOpen;
    });
  }

  function openProfileModal() {
    setIsProfileModalOpen(true);
    setIsOpen(false);
  }

  function closeProfileModal() {
    setIsProfileModalOpen(false);
  }

  function openSignOutModal() {
    setIsSignOutModalOpen(true);
    setIsOpen(false);
  }

  function closeSignOutModal() {
    if (isSigningOut) {
      return;
    }

    setIsSignOutModalOpen(false);
  }

  async function handleConfirmSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await authClient.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
      setIsSignOutModalOpen(false);
    }
  }

  return (
    <>
      <div className={styles.wrapper} ref={wrapperRef}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="User menu"
          aria-expanded={isOpen}
          aria-controls="header-user-menu"
          onClick={toggleMenu}
          disabled={isPending && !user}
        >
          <UserCircle size={28} />
          <span>{firstName}</span>
        </button>

        {isOpen && (
          <div
            id="header-user-menu"
            className={styles.dropdown}
            role="menu"
            aria-label="User menu"
          >
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              aria-label="Profile"
              onClick={openProfileModal}
            >
              Profile
            </button>
            <Link
              href="/settings"
              className={styles.menuLink}
              role="menuitem"
              aria-label="Settings"
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => setIsOpen(false)}
            >
              Settings
            </Link>
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              aria-label="Sign out"
              onClick={openSignOutModal}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {isProfileModalOpen && user && (
        <div
          className={styles.backdrop}
          role="presentation"
          onClick={closeProfileModal}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="profile-modal-title" className={styles.modalTitle}>
              Profile
            </h2>

            <div className={styles.profileDetails}>
              <div className={styles.profileField}>
                <span className={styles.profileLabel}>Name</span>
                <span className={styles.profileValue}>{user.name}</span>
              </div>
              <div className={styles.profileField}>
                <span className={styles.profileLabel}>Email</span>
                <span className={styles.profileValue}>{user.email}</span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={closeProfileModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isSignOutModalOpen && (
        <div
          className={styles.backdrop}
          role="presentation"
          onClick={closeSignOutModal}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-out-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="sign-out-modal-title" className={styles.modalTitle}>
              Sign out
            </h2>
            <p className={styles.message}>
              Sign out of Avexa Workspace? You will need to sign in again to
              continue.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeSignOutModal}
                disabled={isSigningOut}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleConfirmSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
