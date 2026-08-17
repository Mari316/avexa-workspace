import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "../db";
import * as schema from "../db/schema";

/**
 * Better Auth owns users, sessions, credential accounts, and cookie issuance.
 * Public sign-up is disabled — demo users come only from the seed script.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: ["admin", "qa_engineer", "viewer"],
        required: true,
        defaultValue: "viewer",
        // Clients must never set role via sign-up / update-user APIs.
        input: false,
        returned: true,
      },
    },
  },
  session: {
    // Long enough for local demo / Playwright storageState; still revocable on logout.
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    // Keep disabled so getSession loads user.role from PostgreSQL each request.
    cookieCache: {
      enabled: false,
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = Session["user"];
