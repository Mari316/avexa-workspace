"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { openHeaderDropdown, subscribeHeaderDropdown } from "../../lib/headerDropdowns";
import {
  getNotificationHref,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
  type Notification,
} from "../../lib/mockNotifications";

import styles from "./NotificationsPanel.module.css";

export default function NotificationsPanel() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    getNotifications(),
  );
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  useEffect(() => {
    return subscribeNotifications(() => {
      setNotifications(getNotifications());
    });
  }, []);

  useEffect(() => {
    return subscribeHeaderDropdown((opened) => {
      if (opened === "search" || opened === "userMenu") {
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

  function toggleDropdown() {
    setIsOpen((current) => {
      const nextOpen = !current;

      if (nextOpen) {
        openHeaderDropdown("notifications");
      }

      return nextOpen;
    });
  }

  function handleMarkAllRead() {
    markAllNotificationsRead();
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }

    setIsOpen(false);
  }

  function renderNotificationContent(notification: Notification) {
    return (
      <>
        <span
          className={`${styles.unreadDot} ${
            notification.read ? styles.unreadDotHidden : ""
          }`}
          aria-hidden="true"
        />
        <div className={styles.notificationContent}>
          <p
            className={`${styles.notificationTitle} ${
              !notification.read ? styles.notificationTitleUnread : ""
            }`}
          >
            {notification.title}
          </p>
          <p className={styles.notificationDescription}>
            {notification.description}
          </p>
          <p className={styles.notificationTime}>
            {notification.relativeTime}
          </p>
        </div>
      </>
    );
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.iconButton}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-controls="header-notifications-panel"
        onClick={toggleDropdown}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-label={`${unreadCount} unread notifications`}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="header-notifications-panel"
          className={styles.dropdown}
          role="region"
          aria-label="Notifications"
        >
          <div className={styles.dropdownHeader}>
            <h2 className={styles.dropdownTitle}>Notifications</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markAllButton}
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.map((notification) => {
              const className = `${styles.notificationItem} ${
                !notification.read ? styles.notificationItemUnread : ""
              }`;

              if (notification.link) {
                return (
                  <Link
                    key={notification.id}
                    href={getNotificationHref(notification.link)}
                    className={className}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {renderNotificationContent(notification)}
                  </Link>
                );
              }

              return (
                <button
                  key={notification.id}
                  type="button"
                  className={className}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {renderNotificationContent(notification)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
