# Avexa Playwright Test Framework

Workspace package `@avexa/playwright`. Chromium coverage for Avexa against an isolated `avexa_test` database.

At portfolio freeze the full suite is **64 passing tests**. That number is a baseline, not a coverage claim.

## 1. Purpose

This project demonstrates a production-style QA automation architecture over Avexa.

Principles:

- Playwright + TypeScript
- Strict types
- API prerequisites for UI tests
- Built-in `APIRequestContext` (`request`)
- Test-scoped fixtures
- Thin API clients
- Typed factories
- Thin page objects where interactions are reused
- Safe test-data cleanup
- Multiple personas through `storageState`
- API + UI + RBAC + persistence coverage
- No sleeps, serial mode, generic HTTP framework, or giant `BasePage`

The suite covers Clients, Contacts, Projects, Tasks, Notes, Resources, Dashboard, Audit Log, Settings, Team, Auth, and Viewer/RBAC. It does not promise 100% coverage.

## 2. Current architecture

```
playwright/
  auth/                 # setup project: UI login → storageState files
  api/                  # thin HTTP clients + shared error helper
  data/                 # typed payload factories
  fixtures/             # custom test fixtures (API clients, POMs, owned client)
  pages/                # Page Objects for reused UI flows
  support/db/           # guarded avexa_test cleanup
  tests/
    api/                # domain API specs
    ui/                 # domain UI specs
  playwright.config.ts
  package.json
  tsconfig.json
```

| Layer | Responsibility |
| --- | --- |
| **API client** | HTTP transport. Posts/patches/deletes and returns `APIResponse`. No `expect()`. |
| **Factory** | Builds a typed request payload. Does not call the network. |
| **Fixture** | Wires dependencies and lifecycle (create owned client, teardown). |
| **Page Object** | Reused UI locators and interactions. No assertions. |
| **Test** | Business behavior and assertions. |
| **Support** | DB/test-environment utilities (`cleanupTestData`, `assertTestDatabase`). |

```mermaid
flowchart LR
  T[Playwright test] --> F[custom fixtures]
  F --> C[API client]
  F --> P[Page object]
  C --> R[/api/v1]
  P --> U[Next.js UI]
  R --> A[assertion in test]
  U --> A
```

## 3. API clients

Thin wrappers over Playwright’s built-in `request`. They do not invent a second HTTP stack.

| Client | File |
| --- | --- |
| Tasks | `api/tasks.api.ts` |
| Clients | `api/clients.api.ts` |
| Projects | `api/projects.api.ts` |
| Contacts | `api/contacts.api.ts` |
| Notes | `api/notes.api.ts` |
| Dashboard | `api/dashboard.api.ts` |
| Audit Log | `api/audit-log.api.ts` |
| Settings | `api/settings.api.ts` |
| Team | `api/team.api.ts` |
| Resources | `api/resources.api.ts` |
| Shared error helper | `api/errors.ts` (`readApiError`) |

Clients take an `APIRequestContext` in the constructor. Tests normally pass the built-in `request` fixture so cookie auth matches the test’s `storageState`.

Example: `tasksApi.createTask(payload)` → `request.post("/api/v1/tasks", { data })` → the spec asserts status and body.

## 4. Factories

Typed factories live in `data/`. They build payloads only.

| Factory | File | Required input | Default uniqueness |
| --- | --- | --- | --- |
| `buildClient` | `data/client.factory.ts` | none | `PW client {timestamp}-{uuid}` |
| `buildContact` | `data/contact.factory.ts` | `clientId` | unique last name + `pw.contact.{unique}@example.test` |
| `buildProject` | `data/project.factory.ts` | `clientId` | `PW project {timestamp}-{uuid}` |
| `buildTask` | `data/task.factory.ts` | `projectId` | `PW task {timestamp}-{uuid}` |
| `buildNote` | `data/note.factory.ts` | `projectId` | `PW note {timestamp}-{uuid}` |
| `buildResource` | `data/resource.factory.ts` | `projectId` | `PW resource {suffix}` + unique URL |

Overrides replace individual fields (empty name, invalid email) for validation cases.

## 5. Fixtures

`fixtures/test.ts` extends Playwright `test`. Custom fixtures are **test-scoped**. Playwright built-ins (`page`, `request`, `playwright`, and so on) keep their usual Playwright scope.

API and UI specs import `{ test, expect }` from `fixtures/test.ts`. Auth setup stays on `@playwright/test`.

### Built-in Playwright fixtures used here

- `page` — browser page
- `request` — `APIRequestContext` with the test’s `storageState`
- `playwright` — used only when a second persona request context is required

### API fixtures

| Fixture | Source | Role |
| --- | --- | --- |
| `tasksApi` | `request` | `TasksApi` |
| `clientsApi` | `request` | `ClientsApi` |
| `projectsApi` | `request` | `ProjectsApi` |
| `contactsApi` | `request` | `ContactsApi` |
| `notesApi` | `request` | `NotesApi` |
| `dashboardApi` | `request` | `DashboardApi` |
| `auditLogApi` | `request` | `AuditLogApi` |
| `settingsApi` | `request` | `SettingsApi` |
| `resourcesApi` | `request` | `ResourcesApi` |
| `teamApi` | `request` | `TeamApi` |

### Page fixtures

| Fixture | Source | Role |
| --- | --- | --- |
| `clientsPage` | `page` | `ClientsPage` |
| `contactsPage` | `page` | `ContactsPage` |
| `projectsPage` | `page` | `ProjectsPage` |
| `tasksPage` | `page` | `TasksPage` |
| `taskDetailsPage` | `page` | `TaskDetailsPage` |
| `notesPage` | `page` | `NotesPage` |

### Reusable client data fixture

| Fixture | Source | Role |
| --- | --- | --- |
| `client` | `clientsApi` | create a unique client, yield `CreatedClient`, teardown via `cleanupTestData` |

```
request
  → clientsApi
    → client
      → automatic teardown
```

`client` throws if create is not HTTP 201 (for example if a Viewer test requested it).

The only data fixture is `client`. There are no `project`, `contact`, `task`, `note`, or `resource` fixtures.

Each test gets a fresh API wrapper, a fresh page object, and — when used — its own client row. Nothing is worker-scoped mutable domain data.

## 6. Pages / POMs

Page objects exist only where UI interactions are reused:

| Page object | File |
| --- | --- |
| `ClientsPage` | `pages/clients.page.ts` |
| `ContactsPage` | `pages/contacts.page.ts` |
| `ProjectsPage` | `pages/projects.page.ts` |
| `TasksPage` | `pages/tasks.page.ts` |
| `TaskDetailsPage` | `pages/task-details.page.ts` |
| `NotesPage` | `pages/notes.page.ts` |

Dashboard, Audit Log, Settings, Team, and Resources specs are simple enough to use `page.goto` and role locators in the spec. They do not need dedicated POMs.

There is no `BasePage`, `LoginPage`, or navigation class. Login lives in `auth-setup`. Assertions stay in the spec. Page objects only drive the UI.

## 7. Authentication and personas

`playwright.config.ts` defines two projects:

1. **`auth-setup`** — empty `storageState`, runs `auth/auth.setup.ts`
2. **`chromium`** — `dependencies: ["auth-setup"]`

Setup logs in through `/login` so Better Auth can set its HttpOnly cookie, then writes gitignored files:

| Persona | Role | File |
| --- | --- | --- |
| Mari | Admin | `.auth/mari.json` |
| Chris | QA Engineer | `.auth/chris.json` |
| Alex | Viewer | `.auth/alex.json` |
| Anonymous | none | `test.use({ storageState: { cookies: [], origins: [] } })` |

Anonymous is not a file. Credentials are the seeded **LOCAL / DEMO** accounts (`Password123!`).

Config default `storageState` is Mari. Specs override per `test.describe` with `test.use({ storageState: "..." })`.

Playwright applies that state to both browser `page` and API `request` for the test, so API clients send the same session cookie.

### Request context

The framework normally reuses the built-in `request` fixture. It does **not** create a new request context per API method.

Settings isolation is an intentional exception. When a test must act as Chris and Alex at the same time, it creates a second persona `APIRequestContext` with `playwright.request.newContext({ storageState: "./.auth/alex.json" })`. That is for multi-persona isolation, not a second HTTP framework.

## 8. Test data and cleanup

**Owned test data** means the test (or the `client` fixture) creates a unique row and is responsible for removing it. Successful mutations do not edit shared seed slugs such as `pax8` or `account-management`.

Seed rows are still used when the test only **reads** or expects **403/401**, and when a parent UUID is required but the persona cannot create that parent (QA project on the seeded Pax8 client).

UI tests that need persisted rows create them through the API first, then assert in the browser.

### Cleanup graph

Prefer the product API when it can delete.

- **Tasks, Notes, Resources** — public DELETE exists; tests delete through the API when they created the row.
- **Clients / Projects / Contacts** — no DELETE routes; owned rows go through `cleanupTestData`.

`cleanupTestData` deletes only the listed ids/slugs and their dependent graph on `avexa_test`:

1. Expand client → projects / contacts
2. Expand project → tasks / notes / resources
3. Delete resources
4. Delete notes
5. Delete tasks
6. Delete projects
7. Clear `primary_contact_id`
8. Delete contacts
9. Delete clients
10. Delete listed audit entities by `(entity_type, entity_slug)`

Resources are removed before projects. Notes and tasks are removed before their parent project.

### `avexa_test` safety

Guards in `assertTestDatabase`:

- `DATABASE_URL` must target `avexa_test`
- `ALLOW_TEST_DB_MUTATION` must be `"true"`
- refuses the development database `avexa`
- refuses non-local hosts by default

There is no blind DB cleanup against a non-test database.

Admin project/contact/note/resource tests attach children to the owned `client` fixture; fixture teardown removes the client graph. QA project create uses `cleanupTestData({ projectSlugs })` because Chris cannot create a parent client.

## 9. Coverage

Current feature coverage (API and/or UI; not 100% of every path):

- Clients
- Contacts
- Projects
- Tasks
- Notes
- Resources
- Dashboard
- Audit Log
- Settings
- Team
- Auth
- Viewer / RBAC

64 tests at portfolio freeze.

## 10. Test organization

Files are **by domain**, not one RBAC spec. Inside each API file, `describe` blocks are Admin / QA Engineer / Viewer / Anonymous as needed.

```
tests/api/
  clients.api.spec.ts
  contacts.api.spec.ts
  projects.api.spec.ts
  tasks.api.spec.ts
  notes.api.spec.ts
  resources.api.spec.ts
  dashboard.api.spec.ts
  audit-log.api.spec.ts
  settings.api.spec.ts
  team.api.spec.ts
tests/ui/
  auth.spec.ts
  clients.spec.ts
  contacts.spec.ts
  projects.spec.ts
  tasks.spec.ts
  notes.spec.ts
  resources.spec.ts
  dashboard.spec.ts
  audit-log.spec.ts
  settings.spec.ts
  team.spec.ts
  viewer.spec.ts
```

`viewer.spec.ts` is a cross-page Viewer UI check. It is not a second domain POM.

Default UI specs run as Mari (config `storageState`) unless a describe overrides the persona.

## 11. Stability

Intentional stability patterns:

- Web-first assertions (`toBeVisible`, `toHaveURL`, `toHaveCount` on a specific locator)
- No hard waits / `page.waitForTimeout`
- Unique owned data instead of global counts
- No assertions on “how many clients exist in the whole database”
- Safe, guarded cleanup
- Targeted increased timeout for the first Next.js `dev` compilation in auth and dashboard navigation tests

`auth.spec.ts` and `dashboard.spec.ts` raise the test budget to 60s and use a 45s assertion timeout when navigating to `/tasks` or `/tasks/[slug]`. That is first-compile behavior of `next dev` under parallel workers, not an application bug.

## 12. TypeScript

`playwright/tsconfig.json` extends `@repo/typescript-config/base.json`:

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `module` / `moduleResolution`: `NodeNext`
- `noEmit: true`

The package is `"type": "module"`, so local imports use the `.js` specifier (`../api/clients.api.js`) even though the source is `.ts`.

Request/response shapes are typed. Response readers narrow `unknown` JSON; they do not use `any`.

`npm run check-types -w @avexa/playwright` runs `tsc --noEmit`.

## 13. Playwright configuration

From `playwright.config.ts`:

| Setting | Value |
| --- | --- |
| Browser | Chromium (`Desktop Chrome`) |
| `baseURL` | `http://localhost:3001` |
| `fullyParallel` | `true` |
| `retries` | `2` on CI, `0` locally |
| `workers` | `2` on CI, Playwright default locally |
| `forbidOnly` | enabled on CI |
| `trace` | `on-first-retry` |
| `screenshot` | `only-on-failure` |
| `video` | `retain-on-failure` |
| Reporters | `list` + `html` (`open: "never"` on CI, `"on-failure"` locally) |
| Default `storageState` | `./.auth/mari.json` |
| `webServer` | `npm run dev:test -w web` on port 3001, `reuseExistingServer: false` |
| Projects | `auth-setup` → `chromium` depends on it |

`webServer` points the app at `avexa_test` (`DATABASE_URL`, `ALLOW_TEST_DB_MUTATION`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AVEXA_PLAYWRIGHT=1`).

`BETTER_AUTH_SECRET` must be set (env, `apps/web/.env.test`, or `apps/web/.env`) or config throws.

## 14. Running tests locally

Postgres must be up (`npm run db:up` from the repo root). Root scripts prepare `avexa_test` first.

From the **repo root**:

```bash
npm run test:e2e      # db:test:prepare && full Playwright suite
npm run test:api      # db:test:prepare && tests/api
npm run test:e2e:ui   # db:test:prepare && tests/ui
```

From the **Playwright package** (does not prepare the database):

```bash
npm run test -w @avexa/playwright            # full suite
npm run test:api -w @avexa/playwright        # API specs (+ auth-setup)
npm run test:e2e-ui -w @avexa/playwright     # UI specs (+ auth-setup)
npm run test:headed -w @avexa/playwright     # headed Chromium
npm run test:ui -w @avexa/playwright         # Playwright UI mode
npm run test:debug -w @avexa/playwright      # Playwright Inspector
npm run check-types -w @avexa/playwright     # tsc --noEmit
```

`test:ui` is **Playwright UI mode** (`playwright test --ui`).  
`test:e2e-ui` / `test:e2e:ui` is the **UI spec folder** (`tests/ui`).

`auth-setup` still runs when you filter to `tests/api` or `tests/ui` because `chromium` depends on it.

## 15. CI

`.github/workflows/playwright.yml` runs on push to `main` and on pull requests.

```
push / PR
  → checkout, Node 22, npm ci
  → Playwright Chromium
  → Postgres 17 service (same demo creds as compose.yaml)
  → npm run db:test:prepare          # create/migrate/reset/seed avexa_test
  → npm run check-types -w web
  → npm run check-types -w @avexa/playwright
  → npm run test -w @avexa/playwright
  → upload playwright-report + test-results (always, 7 days)
```

CI uses 2 workers, `list` + HTML reporters, 2 retries, and the configured trace/screenshot/video on failure or retry.

No GitHub Actions secrets. Demo `BETTER_AUTH_SECRET` and compose-matching DB credentials are workflow env. Login users are the seeded local-demo accounts, not production credentials.

## 16. Design decisions

- **Domain specs, not one RBAC file** — each domain keeps its own create/validate/forbid cases; personas are `describe` blocks inside the domain.
- **API setup where the assertion is UI** — owned rows are created over HTTP, then the browser asserts persisted state.
- **Owned data instead of mutating seed** — parallel tests and a reusable `avexa_test` baseline stay stable.
- **Assertions in tests** — clients return `APIResponse`; page objects return locators/void.
- **Thin API clients** — wrap `request`, no expected-status helper, no second HTTP stack.
- **No BasePage** — thin POMs only where interactions are reused.
- **No arbitrary sleeps** — waits are Playwright auto-waiting, `waitForURL`, and response status.
- **No worker-scoped mutable data** — fixtures are test-scoped; factories generate unique names.
- **Abstractions only after reuse** — one `client` fixture; no project/contact/task fixtures.

## 17. Explicit non-goals

Intentionally not added:

- Giant `BasePage`
- Generic HTTP client / interceptor stack
- Worker-scoped mutable domain data
- Kafka
- Kubernetes
- Secret-manager abstraction
- Generic repository layer in the test framework
- Blind retries
- Serial tests
- Sleeps
- Unnecessary infrastructure (contract-testing framework, multi-browser matrix, JUnit/Slack dashboards, CD)

These are scoped choices for a single Next.js portfolio app, not unfinished enterprise scaffolding.

## 18. Interview architecture summary

```
Auth setup (UI login)
        ↓
storageState personas (Mari / Chris / Alex; anonymous = empty)
        ↓
custom fixtures (test-scoped)
     ↙            ↘
API clients      thin POMs (where reused)
     ↓                ↓
API tests           UI tests
      ↘            ↙
   owned test data (factories + client fixture)
            ↓
   cleanup (public DELETE where available; guarded avexa_test otherwise)
            ↓
   GitHub Actions CI (web typecheck + Playwright typecheck + suite)
```
