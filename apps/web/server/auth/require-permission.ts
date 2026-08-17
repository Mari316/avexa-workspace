import {
  hasPermission,
  type Permission,
} from "../../lib/auth/permissions";
import { requireUser, type SafeUser } from "./require-user";

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Authenticates the caller, then checks the given application permission.
 * Throws UnauthorizedError (no session) or ForbiddenError (missing permission).
 */
export async function requirePermission(
  permission: Permission,
): Promise<SafeUser> {
  const user = await requireUser();

  if (!hasPermission(user.role, permission)) {
    throw new ForbiddenError();
  }

  return user;
}
