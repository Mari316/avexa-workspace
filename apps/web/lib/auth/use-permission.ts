"use client";

import { authClient } from "../auth-client";
import {
  hasPermission,
  isRole,
  type Permission,
  type Role,
} from "./permissions";

/**
 * UX-only permission check from the current Better Auth session role.
 * Server/API authorization remains authoritative.
 */
export function usePermission(permission: Permission): boolean {
  const { data: session } = authClient.useSession();
  const roleValue = session?.user?.role;
  const role: Role = isRole(roleValue) ? roleValue : "viewer";

  return hasPermission(role, permission);
}
