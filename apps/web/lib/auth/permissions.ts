/**
 * Pure application RBAC definitions shared by server enforcement and client UX.
 * No cookies, headers, database, or Better Auth imports — safe for any bundle.
 */

export const ROLES = ["admin", "qa_engineer", "viewer"] as const;

export type Role = (typeof ROLES)[number];

export type Permission =
  | "dashboard:read"
  | "audit:read"
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
  | "tasks:delete"
  | "notes:read"
  | "notes:create"
  | "notes:update"
  | "notes:delete";

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: [
    "dashboard:read",
    "audit:read",
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
    "notes:read",
    "notes:create",
    "notes:update",
    "notes:delete",
  ],
  qa_engineer: [
    "dashboard:read",
    "audit:read",
    "clients:read",
    "contacts:read",
    "projects:read",
    "projects:create",
    "projects:update",
    "tasks:read",
    "tasks:create",
    "tasks:update",
    "tasks:delete",
    "notes:read",
    "notes:create",
    "notes:update",
    "notes:delete",
  ],
  viewer: [
    "dashboard:read",
    "audit:read",
    "clients:read",
    "contacts:read",
    "projects:read",
    "tasks:read",
    "notes:read",
  ],
};

export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ROLES as readonly string[]).includes(value)
  );
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
