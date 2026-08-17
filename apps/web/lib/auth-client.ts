import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "../server/auth/auth";

/**
 * Browser Better Auth client. Same-origin, so baseURL can be omitted; cookies
 * are sent automatically on credentialed requests.
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});