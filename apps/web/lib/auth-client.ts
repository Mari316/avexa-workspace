import { createAuthClient } from "better-auth/react";

/**
 * Browser Better Auth client. Same-origin, so baseURL can be omitted; cookies
 * are sent automatically on credentialed requests.
 */
export const authClient = createAuthClient();
