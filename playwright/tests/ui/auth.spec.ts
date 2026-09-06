import { expect, test } from "../../fixtures/test.js";

test.describe("Authentication", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated /tasks returns to /tasks after login", async ({
    page,
  }) => {
    await page.goto("/tasks");

    await expect(page).toHaveURL(/\/login/);
    expect(new URL(page.url()).searchParams.get("next")).toBe("/tasks");

    await page.getByLabel("Email").fill("mari@avexa.test");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/tasks\/?$/);
    await expect(
      page.getByRole("heading", { name: "Tasks", exact: true }),
    ).toBeVisible();
  });
});
