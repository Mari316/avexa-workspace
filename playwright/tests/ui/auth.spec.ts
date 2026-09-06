import { expect, test } from "../../fixtures/test.js";

test.describe("Authentication", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated /tasks returns to /tasks after login", async ({
    page,
  }) => {
    // First next-dev compile of /tasks under parallel workers can exceed the
    // default 30s test budget after login + document navigation.
    test.setTimeout(60_000);

    await page.goto("/tasks");

    await expect(page).toHaveURL(/\/login/);
    expect(new URL(page.url()).searchParams.get("next")).toBe("/tasks");

    await page.getByLabel("Email").fill("mari@avexa.test");
    await page.getByLabel("Password").fill("Password123!");

    const signedIn = page.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/sign-in/email") &&
        response.request().method() === "POST" &&
        response.ok(),
    );
    await page.getByRole("button", { name: "Sign in" }).click();
    await signedIn;

    await expect(page).toHaveURL(/\/tasks\/?$/);
    await expect(
      page.getByRole("heading", { name: "Tasks", exact: true }),
    ).toBeVisible({ timeout: 45_000 });
  });
});
