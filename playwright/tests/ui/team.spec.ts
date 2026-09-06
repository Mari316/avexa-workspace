import { expect, test } from "../../fixtures/test.js";

test.describe("Team UI", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("shows a read-only directory of real users", async ({ page }) => {
      await page.goto("/team");
      await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
      await expect(page.getByText("Loading team…")).toHaveCount(0);

      const table = page.getByRole("table");
      await expect(table).toBeVisible();

      const mariRow = table.getByRole("row", { name: "Mari Astapova" });
      const chrisRow = table.getByRole("row", { name: "Chris Miller" });
      const alexRow = table.getByRole("row", { name: "Alex Brown" });

      await expect(mariRow).toBeVisible();
      await expect(mariRow).toContainText("mari@avexa.test");
      await expect(mariRow).toContainText("Admin");
      await expect(mariRow.getByText("You", { exact: true })).toBeVisible();

      await expect(chrisRow).toBeVisible();
      await expect(chrisRow).toContainText("chris@avexa.test");
      await expect(chrisRow).toContainText("QA Engineer");

      await expect(alexRow).toBeVisible();
      await expect(alexRow).toContainText("alex@avexa.test");
      await expect(alexRow).toContainText("Viewer");

      await expect(table.getByRole("row", { name: "Sofia Chen" })).toHaveCount(0);
      await expect(table.getByRole("row", { name: "Daniel Kim" })).toHaveCount(0);

      await expect(
        page.getByRole("button", { name: "Add Team Member" }),
      ).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
    });
  });
});
