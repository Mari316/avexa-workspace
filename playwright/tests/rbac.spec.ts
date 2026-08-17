import { expect, test } from "@playwright/test";

const SEED_PROJECT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

test.describe("Admin (Mari)", () => {
  test.use({ storageState: "./.auth/mari.json" });

  test("can create and delete a task", async ({ request }) => {
    const title = `RBAC Admin Task ${Date.now()}`;

    const create = await request.post("/api/v1/tasks", {
      data: {
        title,
        projectId: SEED_PROJECT_ID,
        assignee: "Mari",
        dueDate: "2026-12-31",
        priority: "Low",
        status: "To Do",
      },
    });

    expect(create.status()).toBe(201);
    const created = await create.json();
    const slug = created.data.slug as string;

    const del = await request.delete(`/api/v1/tasks/${slug}`);
    expect(del.status()).toBe(204);
  });

  test("can mutate a client", async ({ request }) => {
    const get = await request.get("/api/v1/clients/pax8");
    expect(get.status()).toBe(200);
    const { data } = await get.json();
    const originalStatus = data.status as string;
    const nextStatus = originalStatus === "Active" ? "On Hold" : "Active";

    const patch = await request.patch("/api/v1/clients/pax8", {
      data: { status: nextStatus },
    });
    expect(patch.status()).toBe(200);

    const restore = await request.patch("/api/v1/clients/pax8", {
      data: { status: originalStatus },
    });
    expect(restore.status()).toBe(200);
  });
});

test.describe("QA Engineer (Chris)", () => {
  test.use({ storageState: "./.auth/chris.json" });

  test("can read clients but cannot create or update them", async ({
    request,
  }) => {
    const list = await request.get("/api/v1/clients");
    expect(list.status()).toBe(200);

    const create = await request.post("/api/v1/clients", {
      data: { name: `QA Forbidden Client ${Date.now()}`, status: "Active" },
    });
    expect(create.status()).toBe(403);
    const createBody = await create.json();
    expect(createBody.error.code).toBe("FORBIDDEN");

    const patch = await request.patch("/api/v1/clients/pax8", {
      data: { status: "On Hold" },
    });
    expect(patch.status()).toBe(403);
  });

  test("can read contacts but cannot create or update them", async ({
    request,
  }) => {
    const list = await request.get("/api/v1/contacts");
    expect(list.status()).toBe(200);

    const create = await request.post("/api/v1/contacts", {
      data: {
        firstName: "QA",
        lastName: `Forbidden ${Date.now()}`,
        clientId: "11111111-1111-4111-8111-111111111111",
        email: "qa.forbidden@example.test",
        role: "Tester",
        status: "Active",
      },
    });
    expect(create.status()).toBe(403);

    const patch = await request.patch("/api/v1/contacts/mitchell-lubbers", {
      data: { role: "Should Not Update" },
    });
    expect(patch.status()).toBe(403);
  });

  test("can create and delete a task", async ({ request }) => {
    const title = `RBAC QA Task ${Date.now()}`;

    const create = await request.post("/api/v1/tasks", {
      data: {
        title,
        projectId: SEED_PROJECT_ID,
        assignee: "Chris",
        dueDate: "2026-12-31",
        priority: "Medium",
        status: "To Do",
      },
    });

    expect(create.status()).toBe(201);
    const created = await create.json();
    const slug = created.data.slug as string;

    const patch = await request.patch(`/api/v1/tasks/${slug}`, {
      data: { status: "In Progress" },
    });
    expect(patch.status()).toBe(200);

    const del = await request.delete(`/api/v1/tasks/${slug}`);
    expect(del.status()).toBe(204);
  });

  test("can update a project", async ({ request }) => {
    const get = await request.get("/api/v1/projects/account-management");
    expect(get.status()).toBe(200);
    const { data } = await get.json();
    const originalStatus = data.status as string;
    const nextStatus = originalStatus === "Active" ? "On Hold" : "Active";

    const patch = await request.patch("/api/v1/projects/account-management", {
      data: { status: nextStatus },
    });
    expect(patch.status()).toBe(200);

    const restore = await request.patch("/api/v1/projects/account-management", {
      data: { status: originalStatus },
    });
    expect(restore.status()).toBe(200);
  });
});

test.describe("Viewer (Alex)", () => {
  test.use({ storageState: "./.auth/alex.json" });

  test("can read core domains but cannot mutate via API", async ({
    request,
  }) => {
    for (const path of [
      "/api/v1/clients",
      "/api/v1/contacts",
      "/api/v1/projects",
      "/api/v1/tasks",
    ]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
    }

    const postClient = await request.post("/api/v1/clients", {
      data: { name: `Viewer Forbidden ${Date.now()}`, status: "Active" },
    });
    expect(postClient.status()).toBe(403);

    const patchClient = await request.patch("/api/v1/clients/pax8", {
      data: { status: "On Hold" },
    });
    expect(patchClient.status()).toBe(403);

    const postTask = await request.post("/api/v1/tasks", {
      data: {
        title: `Viewer Forbidden Task ${Date.now()}`,
        projectId: SEED_PROJECT_ID,
        assignee: "Alex",
        dueDate: "2026-12-31",
      },
    });
    expect(postTask.status()).toBe(403);

    const delTask = await request.delete(
      "/api/v1/tasks/finish-regression-coverage",
    );
    expect(delTask.status()).toBe(403);
  });

  test("hides representative mutation controls in the UI", async ({ page }) => {
    await page.goto("/clients");
    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Client" }),
    ).toHaveCount(0);

    await page.goto("/projects");
    await expect(
      page.getByRole("button", { name: "Add Project" }),
    ).toHaveCount(0);

    await page.goto("/tasks");
    await expect(page.getByRole("button", { name: "Add Task" })).toHaveCount(0);

    await page.goto("/notes");
    await expect(page.getByRole("button", { name: "Add Note" })).toHaveCount(0);

    await page.goto("/resources");
    await expect(
      page.getByRole("button", { name: "Add Resource" }),
    ).toHaveCount(0);

    await page.goto("/team");
    await expect(
      page.getByRole("button", { name: "Add Team Member" }),
    ).toHaveCount(0);
  });
});

test.describe("Anonymous", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("API requests still return 401", async ({ request }) => {
    const res = await request.get("/api/v1/clients");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
