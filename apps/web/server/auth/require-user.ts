import { headers } from "next/headers";

import { isRole, type Role } from "../../lib/auth/permissions";
import { auth, type AuthUser } from "./auth";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

function toSafeUser(user: AuthUser): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    // DB CHECK + seed keep roles valid; fall back to least privilege if corrupt.
    role: isRole(user.role) ? user.role : "viewer",
  };
}

/**
 * Resolves the Better Auth session from the current request cookies/headers.
 * Returns null when there is no valid session — never treats cookie presence alone
 * as proof of authentication.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  return toSafeUser(session.user);
}

/**
 * Same session resolution as getCurrentUser, but throws UnauthorizedError when
 * the caller is not authenticated. Use from API route handlers.
 */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}
