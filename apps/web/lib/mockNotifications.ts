export type NotificationLink =
  | { type: "task"; slug: string }
  | { type: "project"; slug: string };

export type Notification = {
  id: string;
  title: string;
  description: string;
  relativeTime: string;
  read: boolean;
  link?: NotificationLink;
};

export const initialNotifications: Notification[] = [
  {
    id: "notification-1",
    title: "Task due today",
    description: "Finish regression coverage",
    relativeTime: "5 min ago",
    read: false,
    link: { type: "task", slug: "finish-regression-coverage" },
  },
  {
    id: "notification-2",
    title: "Task assigned to you",
    description: "Validate API regression",
    relativeTime: "1 hour ago",
    read: false,
    link: { type: "task", slug: "validate-api-regression" },
  },
  {
    id: "notification-3",
    title: "Project updated",
    description: "Account Management",
    relativeTime: "Yesterday",
    read: false,
    link: { type: "project", slug: "account-management" },
  },
  {
    id: "notification-4",
    title: "Task moved to Review",
    description: "Review automation PR",
    relativeTime: "Yesterday",
    read: true,
    link: { type: "task", slug: "review-automation-pr" },
  },
  {
    id: "notification-5",
    title: "Sprint planning reminder",
    description: "QA sync scheduled for 2:00 PM",
    relativeTime: "2 days ago",
    read: true,
  },
];

type NotificationListener = () => void;

let notifications: Notification[] = initialNotifications.map((notification) => ({
  ...notification,
}));
let nextNotificationId = 100;
const listeners = new Set<NotificationListener>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function prependNotification(
  notification: Omit<Notification, "id"> & { id?: string },
): Notification {
  const newNotification: Notification = {
    id: notification.id ?? `notification-${nextNotificationId++}`,
    title: notification.title,
    description: notification.description,
    relativeTime: notification.relativeTime,
    read: notification.read,
    link: notification.link,
  };

  notifications = [newNotification, ...notifications];
  notifyListeners();

  return newNotification;
}

export function subscribeNotifications(
  listener: NotificationListener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getNotifications(): Notification[] {
  return notifications;
}

export function getUnreadNotificationCount(): number {
  return notifications.filter((notification) => !notification.read).length;
}

export function markNotificationRead(id: string): void {
  notifications = notifications.map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification,
  );
  notifyListeners();
}

export function markAllNotificationsRead(): void {
  notifications = notifications.map((notification) => ({
    ...notification,
    read: true,
  }));
  notifyListeners();
}

export function getNotificationHref(link: NotificationLink): string {
  if (link.type === "task") {
    return `/tasks/${link.slug}`;
  }

  return `/projects/${link.slug}`;
}

export function notifyTaskCreated(taskTitle: string, taskSlug: string): void {
  prependNotification({
    title: "Task created",
    description: taskTitle,
    relativeTime: "Just now",
    read: false,
    link: { type: "task", slug: taskSlug },
  });
}

export function notifyTaskUpdated(
  taskTitle: string,
  taskSlug: string,
  previousStatus: string,
  newStatus: string,
): void {
  if (newStatus === "Review" && previousStatus !== "Review") {
    prependNotification({
      title: "Task moved to Review",
      description: taskTitle,
      relativeTime: "Just now",
      read: false,
      link: { type: "task", slug: taskSlug },
    });
    return;
  }

  prependNotification({
    title: "Task updated",
    description: taskTitle,
    relativeTime: "Just now",
    read: false,
    link: { type: "task", slug: taskSlug },
  });
}

export function notifyProjectUpdated(
  projectName: string,
  projectSlug: string,
): void {
  prependNotification({
    title: "Project updated",
    description: projectName,
    relativeTime: "Just now",
    read: false,
    link: { type: "project", slug: projectSlug },
  });
}
