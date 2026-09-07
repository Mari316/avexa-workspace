# Avexa

Avexa is a QA/project workspace used as the system under test for a professional Playwright + TypeScript automation framework.

The application is feature-complete for this portfolio project. All sidebar domains are real. There is no production CD.

## Product

Avexa is a signed-in workspace for QA and project work. Real features:

- Better Auth authentication and sessions
- RBAC (`admin`, `qa_engineer`, `viewer`)
- Clients
- Contacts
- Projects
- Tasks
- Notes
- Resources
- Dashboard
- Audit Log
- User Settings
- Team directory

Header notifications, if shown, are ephemeral demo chrome. They are not persisted.

## Persistence

```
Next.js UI
  → frontend API helpers (`apps/web/lib/api`)
  → `/api/v1`
  → auth / RBAC
  → domain services
  → Drizzle
  → PostgreSQL
```

Core application data lives in PostgreSQL:

- Clients, Contacts, Projects, Tasks, Notes, and Resources are persisted tables.
- Dashboard is derived from those tables. There is no dashboard table.
- Team is a read-only directory of real Better Auth users.
- Settings are per-user PostgreSQL preferences (`user_settings`).
- Audit Log stores persistent application-level events (`audit_events`).

Development uses the `avexa` database. Playwright uses a separate `avexa_test` database.

## Repository structure

This is a small npm workspaces monorepo. Relevant paths:

| Path | Responsibility |
| --- | --- |
| `apps/web` | Next.js 16 application (UI, `/api/v1`, Drizzle, seed, test-DB tooling) |
| `playwright` | Playwright + TypeScript automation package (`@avexa/playwright`) |
| `.github/workflows` | GitHub Actions for typecheck + Playwright |
| `compose.yaml` | Local PostgreSQL 17 |
| `packages/typescript-config` | Shared TypeScript configs |
| `packages/eslint-config` | Shared ESLint configs |

There is no `docs` app.

## Database

Two databases share the same local Postgres container (`compose.yaml`):

| Database | Purpose |
| --- | --- |
| `avexa` | Manual development / demo |
| `avexa_test` | Playwright and `db:test:*` tooling only |

Current committed migration chain: **0000 through 0010**.

| Migration | What it adds |
| --- | --- |
| `0000_create_clients` | Clients |
| `0001_create_contacts` | Contacts |
| `0002_add_client_primary_contact` | Client primary contact |
| `0003_create_projects` | Projects |
| `0004_create_tasks` | Tasks |
| `0005_create_auth_tables` | Better Auth tables |
| `0006_add_user_role` | User RBAC role |
| `0007_create_notes` | Notes |
| `0008_create_audit_events` | Audit Log |
| `0009_create_user_settings` | User Settings |
| `0010_create_resources` | Resources |

Do not edit applied migration files. Schema changes go through `apps/web/server/db/schema/`, then `npm run db:generate`.

### One-time setup

```sh
cp apps/web/.env.example apps/web/.env
```

Development `DATABASE_URL` matches `compose.yaml`:

```text
DATABASE_URL=postgresql://avexa:avexa@localhost:5432/avexa
```

Required env vars (see `apps/web/.env.example`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

Optional Playwright overrides: copy `apps/web/.env.test.example` to `apps/web/.env.test` (gitignored). Defaults already target `avexa_test`.

### Commands

Verified against the root `package.json`:

| Command | What it does |
| --- | --- |
| `npm run db:up` | Starts PostgreSQL 17 from `compose.yaml` and waits until it is healthy. |
| `npm run db:down` | Stops PostgreSQL. Data survives in the `avexa-postgres-data` volume. |
| `npm run db:migrate` | Applies migrations to the development DB (`avexa`). |
| `npm run db:seed` | Upserts the deterministic seed into development (`avexa`). |
| `npm run db:generate` | Regenerates migration SQL after editing the Drizzle schema. |
| `npm run db:test:ensure` | Creates `avexa_test` if missing (same Postgres container). |
| `npm run db:test:migrate` | Applies the current committed migrations to `avexa_test`. |
| `npm run db:test:seed` | Seeds `avexa_test` (upsert only; does not delete leftovers). |
| `npm run db:test:reset` | Guarded truncate of test data + reseed baseline on `avexa_test`. |
| `npm run db:test:prepare` | Ensure + migrate + clean reset/seed (exact `avexa_test` baseline). |
| `npm run check-types` | Turbo typecheck across workspaces. |
| `npm run check-types -w web` | Next.js typegen + `tsc --noEmit` for the web app. |
| `npm run check-types -w @avexa/playwright` | `tsc --noEmit` for the Playwright package. |
| `npm run dev` | Starts workspace dev tasks (web on port **3000** → `avexa`). |
| `npm run test:e2e` | `db:test:prepare` then the full Playwright suite (web on port **3001** → `avexa_test`). |
| `npm run test:api` | `db:test:prepare` then Playwright API specs. |
| `npm run test:e2e:ui` | `db:test:prepare` then Playwright UI specs. |

Typical first development run:

```sh
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

`npm run db:seed` is idempotent for known seed rows. It does **not** remove leftover test rows. Use `db:test:prepare` / `db:test:reset` on `avexa_test`.

Destructive test-DB helpers refuse to run against `avexa`.

## Demo users

**LOCAL / DEMO credentials only.** Not production secrets. Public sign-up is disabled; users are created by the seed script.

Shared development password: `Password123!`

| Email | Name | Role |
| --- | --- | --- |
| `mari@avexa.test` | Mari Astapova | admin |
| `chris@avexa.test` | Chris Miller | qa_engineer |
| `alex@avexa.test` | Alex Brown | viewer |

## End-to-end tests

```sh
npm run test:e2e
```

This rebuilds a clean `avexa_test` baseline, starts a dedicated Next.js server on port **3001** pointed at `avexa_test` (not the manual `:3000` / `avexa` session), logs in Mari / Chris / Alex, and runs Playwright. The test server uses a separate `.next-test` build directory so it can run alongside `npm run dev`.

See [`playwright/README.md`](playwright/README.md) for the automation architecture.

## Intentional limitations

These are scoped product/portfolio choices, not open defects:

- Task assignee is the display-name set `Mari | Chris | Alex`, not a `user_id` foreign key.
- Settings `defaultAssignee` uses the same temporary assignee model.
- Resource mutations are not written to Audit Log v1.
- Login and logout are not audited.
- Audit writes are best-effort application-level events, not a compliance ledger.
- Header notifications are ephemeral.
- Clients, Contacts, and Projects do not expose delete APIs.
- Small datasets have no pagination.
- This portfolio project has no production CD.
