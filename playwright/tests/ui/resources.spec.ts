import { readCreatedProject } from "../../api/projects.api.js";
import { readResourceList } from "../../api/resources.api.js";
import { buildProject } from "../../data/project.factory.js";
import { buildResource } from "../../data/resource.factory.js";
import { expect, test } from "../../fixtures/test.js";

test.describe("Resources UI", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("can create, edit, and delete a resource that survives refresh", async ({
      client,
      page,
      projectsApi,
      resourcesApi,
    }) => {
      const projectPayload = buildProject({ clientId: client.id });
      const createProjectResponse = await projectsApi.createProject(projectPayload);
      expect(createProjectResponse.status()).toBe(201);
      const project = await readCreatedProject(createProjectResponse);

      const resourcePayload = buildResource({
        projectId: project.id,
        type: "Documentation",
      });
      const updatedName = `${resourcePayload.name} edited`;
      const updatedUrl = `${resourcePayload.url}/edited`;
      let createdId: string | undefined;

      try {
        await page.goto("/resources");
        await expect(page.getByRole("heading", { name: "Resources" })).toBeVisible();
        await expect(page.getByText("Loading resources…")).toHaveCount(0);

        await page.getByRole("button", { name: "Add Resource" }).click();
        const addDialog = page.getByRole("dialog", { name: "Add Resource" });
        await expect(addDialog).toBeVisible();

        await addDialog.getByLabel("Resource Name").fill(resourcePayload.name);
        await addDialog.getByLabel("Type").selectOption(resourcePayload.type);
        await addDialog.getByLabel("Client").selectOption(client.name);
        await expect(addDialog.getByLabel("Project")).toBeEnabled();
        await addDialog.getByLabel("Project").selectOption(project.name);
        await addDialog.getByLabel("URL").fill(resourcePayload.url);
        await addDialog.getByLabel("Status").selectOption("Active");
        await addDialog.getByRole("button", { name: "Add Resource" }).click();
        await expect(addDialog).toHaveCount(0);

        const createdRow = page
          .getByRole("table")
          .getByRole("row", { name: resourcePayload.name });
        await expect(createdRow).toBeVisible();
        await expect(createdRow).toContainText(resourcePayload.type);
        await expect(createdRow).toContainText(client.name);
        await expect(createdRow).toContainText(project.name);
        await expect(createdRow).toContainText("Active");

        const createdOpen = createdRow.getByRole("link", {
          name: `Open ${resourcePayload.name}`,
        });
        await expect(createdOpen).toHaveAttribute("href", resourcePayload.url);
        await expect(createdOpen).toHaveAttribute("target", "_blank");
        await expect(createdOpen).toHaveAttribute("rel", /noopener/);
        await expect(createdOpen).toHaveAttribute("rel", /noreferrer/);

        const listAfterCreate = await resourcesApi.listResources();
        expect(listAfterCreate.status()).toBe(200);
        const createdFromList = (await readResourceList(listAfterCreate)).find(
          (resource) => resource.name === resourcePayload.name,
        );
        expect(createdFromList).toBeDefined();
        createdId = createdFromList?.id;

        await page.reload();
        await expect(page.getByText("Loading resources…")).toHaveCount(0);
        await expect(
          page.getByRole("table").getByRole("row", { name: resourcePayload.name }),
        ).toBeVisible();

        await page
          .getByRole("table")
          .getByRole("row", { name: resourcePayload.name })
          .getByRole("button", { name: "Edit" })
          .click();
        const editDialog = page.getByRole("dialog", { name: "Edit Resource" });
        await expect(editDialog).toBeVisible();
        await editDialog.getByLabel("Resource Name").fill(updatedName);
        await editDialog.getByLabel("URL").fill(updatedUrl);
        await editDialog.getByLabel("Status").selectOption("Inactive");
        await editDialog.getByRole("button", { name: "Save Changes" }).click();
        await expect(editDialog).toHaveCount(0);

        const editedRow = page
          .getByRole("table")
          .getByRole("row", { name: updatedName });
        await expect(editedRow).toBeVisible();
        await expect(editedRow).toContainText("Inactive");
        await expect(
          editedRow.getByRole("link", { name: `Open ${updatedName}` }),
        ).toHaveAttribute("href", updatedUrl);

        await page.reload();
        await expect(page.getByText("Loading resources…")).toHaveCount(0);
        const persistedRow = page
          .getByRole("table")
          .getByRole("row", { name: updatedName });
        await expect(persistedRow).toBeVisible();
        await expect(persistedRow).toContainText("Inactive");
        await expect(
          persistedRow.getByRole("link", { name: `Open ${updatedName}` }),
        ).toHaveAttribute("href", updatedUrl);

        await persistedRow.getByRole("button", { name: "Delete" }).click();
        const deleteDialog = page.getByRole("dialog", { name: "Delete Resource" });
        await expect(deleteDialog).toBeVisible();
        await deleteDialog.getByRole("button", { name: "Delete Resource" }).click();
        await expect(deleteDialog).toHaveCount(0);
        await expect(
          page.getByRole("table").getByRole("row", { name: updatedName }),
        ).toHaveCount(0);

        await page.reload();
        await expect(page.getByText("Loading resources…")).toHaveCount(0);
        await expect(
          page.getByRole("table").getByRole("row", { name: updatedName }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("table").getByRole("row", { name: resourcePayload.name }),
        ).toHaveCount(0);
        createdId = undefined;
      } finally {
        if (createdId) {
          await resourcesApi.deleteResource(createdId);
        }
      }
    });
  });
});
