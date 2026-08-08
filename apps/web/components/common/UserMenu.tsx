"use client";

import Link from "next/link";
import { UserCircle } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import {
  openHeaderDropdown,
  subscribeHeaderDropdown,
} from "../../lib/headerDropdowns";
import {
  getUserFullName,
  getUserProfile,
  subscribeUserProfile,
  updateUserProfile,
  type UserProfile,
} from "../../lib/userProfile";

import styles from "./UserMenu.module.css";

type ProfileFormData = {
  firstName: string;
  lastName: string;
  email: string;
};

type ProfileFormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

function profileToFormData(profile: UserProfile): ProfileFormData {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
  };
}

function validateProfileForm(form: ProfileFormData): ProfileFormErrors {
  const errors: ProfileFormErrors = {};

  if (!form.firstName.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  }

  return errors;
}

export default function UserMenu() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => getUserProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [form, setForm] = useState<ProfileFormData>(() =>
    profileToFormData(getUserProfile()),
  );
  const [errors, setErrors] = useState<ProfileFormErrors>({});

  useEffect(() => {
    return subscribeUserProfile(() => {
      setProfile(getUserProfile());
    });
  }, []);

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
    setForm(profileToFormData(getUserProfile()));
    setErrors({});
    setIsEditingProfile(false);
    setIsProfileModalOpen(true);
    setIsOpen(false);
  }

  function closeProfileModal() {
    setIsProfileModalOpen(false);
    setIsEditingProfile(false);
    setErrors({});
  }

  function openSignOutModal() {
    setIsSignOutModalOpen(true);
    setIsOpen(false);
  }

  function closeSignOutModal() {
    setIsSignOutModalOpen(false);
  }

  function handleEditProfile() {
    setForm(profileToFormData(getUserProfile()));
    setErrors({});
    setIsEditingProfile(true);
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateProfileForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    updateUserProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
    });
    setIsEditingProfile(false);
    setErrors({});
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
        >
          <UserCircle size={28} />
          <span>{profile.firstName}</span>
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

      {isProfileModalOpen && (
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

            {isEditingProfile ? (
              <form className={styles.form} onSubmit={handleProfileSubmit}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="profile-first-name">
                    First Name
                  </label>
                  <input
                    id="profile-first-name"
                    className={styles.input}
                    value={form.firstName}
                    aria-invalid={Boolean(errors.firstName)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                  />
                  {errors.firstName && (
                    <span className={styles.error}>{errors.firstName}</span>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="profile-last-name">
                    Last Name
                  </label>
                  <input
                    id="profile-last-name"
                    className={styles.input}
                    value={form.lastName}
                    aria-invalid={Boolean(errors.lastName)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                  />
                  {errors.lastName && (
                    <span className={styles.error}>{errors.lastName}</span>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="profile-email">
                    Email
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    className={styles.input}
                    value={form.email}
                    aria-invalid={Boolean(errors.email)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                  {errors.email && (
                    <span className={styles.error}>{errors.email}</span>
                  )}
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setIsEditingProfile(false);
                      setErrors({});
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.primaryButton}>
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className={styles.profileDetails}>
                  <div className={styles.profileField}>
                    <span className={styles.profileLabel}>Name</span>
                    <span className={styles.profileValue}>
                      {getUserFullName()}
                    </span>
                  </div>
                  <div className={styles.profileField}>
                    <span className={styles.profileLabel}>Role</span>
                    <span className={styles.profileValue}>{profile.role}</span>
                  </div>
                  <div className={styles.profileField}>
                    <span className={styles.profileLabel}>Email</span>
                    <span className={styles.profileValue}>{profile.email}</span>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={closeProfileModal}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleEditProfile}
                  >
                    Edit Profile
                  </button>
                </div>
              </>
            )}
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
              Sign out is not available until authentication is implemented.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={closeSignOutModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
