# Avexa Workspace

## Local database (PostgreSQL + Drizzle)

Avexa persists Clients, Contacts, Projects, and Tasks in PostgreSQL via the Next.js
REST API. Local preference pages (Notes / Resources / Team / Settings) may still use
in-memory UI state.

Two databases share the same local Postgres container (`compose.yaml`):

| Database | Purpose |
| --- | --- |
| `avexa` | Manual development / demo |
| `avexa_test` | Playwright and `db:test:*` tooling only |

### One-time setup

```sh
cp apps/web/.env.example apps/web/.env
```

`DATABASE_URL` for development matches `compose.yaml`:

```text
DATABASE_URL=postgresql://avexa:avexa@localhost:5432/avexa
```

Optional test overrides: copy `apps/web/.env.test.example` to `apps/web/.env.test`
(gitignored). Defaults already target `avexa_test`.

### Commands

| Command | What it does |
| --- | --- |
| `npm run db:up` | Starts PostgreSQL 17 from `compose.yaml` and waits until it is healthy. |
| `npm run db:down` | Stops PostgreSQL. Data survives in the `avexa-postgres-data` volume. |
| `npm run db:migrate` | Applies migrations to the **development** DB (`avexa`). |
| `npm run db:seed` | Upserts the deterministic seed into **development** (`avexa`). |
| `npm run db:generate` | Regenerates migration SQL after editing the Drizzle schema. |
| `npm run db:test:ensure` | Creates `avexa_test` if missing (same Postgres container). |
| `npm run db:test:migrate` | Applies migrations `0000–0006` to `avexa_test`. |
| `npm run db:test:seed` | Seeds `avexa_test` (upsert only; does not delete leftovers). |
| `npm run db:test:reset` | Guarded truncate of test data + reseed baseline on `avexa_test`. |
| `npm run db:test:prepare` | Ensure + migrate + **clean** reset/seed (exact baseline). |
| `npm run test:e2e` | `db:test:prepare` then Playwright (test server on port 3001 → `avexa_test`). |

Typical first development run:

```sh
npm run db:up
npm run db:migrate
npm run db:seed
```

`npm run db:seed` is idempotent for known seed rows. It does **not** remove rows
created by failed tests — use `db:test:prepare` / `db:test:reset` on `avexa_test`.

### End-to-end tests

```sh
npm run test:e2e
```

This rebuilds a clean `avexa_test` baseline, starts a dedicated Next.js server on
port **3001** pointed at `avexa_test` (not your manual `:3000` / `avexa` session),
logs in Mari/Chris/Alex, and runs Playwright. The test server uses a separate
`.next-test` build directory so it can run alongside a normal `npm run dev`.

Destructive test DB helpers refuse to run against `avexa`.

### Authentication (Better Auth)

Local demo users (shared development password `Password123!` — never a production secret):

| Email | Name | Role |
| --- | --- | --- |
| `mari@avexa.test` | Mari Astapova | admin |
| `chris@avexa.test` | Chris Miller | qa_engineer |
| `alex@avexa.test` | Alex Brown | viewer |

Required env vars (see `apps/web/.env.example`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

Public sign-up is disabled. Users are created only by the seed script using Better Auth's password hasher.

### Layout

| Path | Responsibility |
| --- | --- |
| `compose.yaml` | Local PostgreSQL for development. |
| `apps/web/drizzle.config.ts` | Drizzle Kit configuration (schema location, migration output). |
| `apps/web/server/db/index.ts` | Single `pg` connection pool plus the Drizzle client. |
| `apps/web/server/db/schema/` | Table definitions; the source of truth for migrations. |
| `apps/web/server/db/migrations/` | Committed, reviewable SQL migrations. Do not edit applied files. |
| `apps/web/server/db/migrate.ts` | Development migration runner. |
| `apps/web/server/db/test/` | `avexa_test` ensure / migrate / reset / prepare tooling. |
| `apps/web/server/seed/seed.ts` | Deterministic seed data. |
| `playwright/support/db/` | Guarded targeted cleanup for Playwright teardowns. |

Editing the schema means editing `apps/web/server/db/schema/`, then running
`npm run db:generate` and committing the generated SQL.

---

# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo build
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo build
npm dlx turbo build
npm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo build --filter=docs
```

Without global `turbo`:

```sh
npx turbo build --filter=docs
npm exec turbo build --filter=docs
npm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo dev
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo dev
npm exec turbo dev
npm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo dev --filter=web
```

Without global `turbo`:

```sh
npx turbo dev --filter=web
npm exec turbo dev --filter=web
npm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo login
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo login
npm exec turbo login
npm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo link
```

Without global `turbo`:

```sh
npx turbo link
npm exec turbo link
npm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.dev/docs/reference/configuration)
- [CLI Usage](https://turborepo.dev/docs/reference/command-line-reference)
