/**
 * Pure application RBAC definitions shared by server enforcement and client UX.
 * No cookies, headers, database, or Better Auth imports — safe for any bundle.
 */

export const ROLES = ["admin", "qa_engineer", "viewer"] as const;

export type Role = (typeof ROLES)[number];

export type Permission =
  | "clients:read"
  | "clients:create"
  | "clients:update"
  | "contacts:read"
  | "contacts:create"
  | "contacts:update"
  | "projects:read"
  | "projects:create"
  | "projects:update"
  | "tasks:read"
  | "tasks:create"
  | "tasks:update"
  | "tasks:delete";

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: [
    "clients:read",
    "clients:create",
    "clients:update",
    "contacts:read",
    "contacts:create",
    "contacts:update",
    "projects:read",
    "projects:create",
    "projects:update",
    "tasks:read",
    "tasks:create",
    "tasks:update",
    "tasks:delete",
  ],
  qa_engineer: [
    "clients:read",
    "contacts:read",
    "projects:read",
    "projects:create",
    "projects:update",
    "tasks:read",
    "tasks:create",
    "tasks:update",
    "tasks:delete",
  ],
  viewer: ["clients:read", "contacts:read", "projects:read", "tasks:read"],
};

export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ROLES as readonly string[]).includes(value)
  );
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
