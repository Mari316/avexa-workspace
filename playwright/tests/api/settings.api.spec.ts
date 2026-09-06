import { SettingsApi, readSettings } from "../../api/settings.api.js";
import { readApiError } from "../../api/errors.js";
import { expect, test } from "../../fixtures/test.js";

async function clearSettings(api: SettingsApi): Promise<void> {
  const response = await api.updateSettings({
    defaultAssignee: null,
    defaultEnvironment: null,
  });

  if (response.status() !== 200) {
    throw new Error(`Failed to clear settings: HTTP ${response.status()}`);
  }
}

test.describe("Settings API", () => {
  test.describe("QA Engineer (Chris)", () => {
    test.use({ storageState: "./.auth/chris.json" });

    test("returns null defaults, persists a patch, and stays isolated from Alex", async ({
      playwright,
      settingsApi,
    }) => {
      await clearSettings(settingsApi);

      const alexContext = await playwright.request.newContext({
        baseURL: test.info().project.use.baseURL,
        storageState: "./.auth/alex.json",
      });
      const alexApi = new SettingsApi(alexContext);

      try {
        await clearSettings(alexApi);

        const defaultsResponse = await settingsApi.getSettings();
        expect(defaultsResponse.status()).toBe(200);
        expect(await readSettings(defaultsResponse)).toEqual({
          defaultAssignee: null,
          defaultEnvironment: null,
        });

        const patchResponse = await settingsApi.updateSettings({
          defaultAssignee: "Chris",
          defaultEnvironment: "QA",
        });
        expect(patchResponse.status()).toBe(200);
        expect(await readSettings(patchResponse)).toEqual({
          defaultAssignee: "Chris",
          defaultEnvironment: "QA",
        });

        const getAfterPatch = await settingsApi.getSettings();
        expect(getAfterPatch.status()).toBe(200);
        expect(await readSettings(getAfterPatch)).toEqual({
          defaultAssignee: "Chris",
          defaultEnvironment: "QA",
        });

        const alexDefaults = await alexApi.getSettings();
        expect(alexDefaults.status()).toBe(200);
        expect(await readSettings(alexDefaults)).toEqual({
          defaultAssignee: null,
          defaultEnvironment: null,
        });

        const alexPatch = await alexApi.updateSettings({
          defaultAssignee: "Mari",
          defaultEnvironment: "Demo",
        });
        expect(alexPatch.status()).toBe(200);
        expect(await readSettings(alexPatch)).toEqual({
          defaultAssignee: "Mari",
          defaultEnvironment: "Demo",
        });

        const alexGet = await alexApi.getSettings();
        expect(alexGet.status()).toBe(200);
        expect(await readSettings(alexGet)).toEqual({
          defaultAssignee: "Mari",
          defaultEnvironment: "Demo",
        });

        const chrisAfterAlex = await settingsApi.getSettings();
        expect(chrisAfterAlex.status()).toBe(200);
        expect(await readSettings(chrisAfterAlex)).toEqual({
          defaultAssignee: "Chris",
          defaultEnvironment: "QA",
        });

        const clearAssignee = await settingsApi.updateSettings({
          defaultAssignee: null,
        });
        expect(clearAssignee.status()).toBe(200);
        expect(await readSettings(clearAssignee)).toEqual({
          defaultAssignee: null,
          defaultEnvironment: "QA",
        });

        const getAfterClear = await settingsApi.getSettings();
        expect(getAfterClear.status()).toBe(200);
        expect(await readSettings(getAfterClear)).toEqual({
          defaultAssignee: null,
          defaultEnvironment: "QA",
        });
      } finally {
        await clearSettings(settingsApi);
        await clearSettings(alexApi);
        await alexContext.dispose();
      }
    });

    test("rejects empty and invalid patches", async ({ request, settingsApi }) => {
      const emptyResponse = await settingsApi.updateSettings({});
      expect(emptyResponse.status()).toBe(400);
      const emptyError = await readApiError(emptyResponse);
      expect(emptyError.code).toBe("VALIDATION_ERROR");

      const invalidResponse = await request.patch("/api/v1/settings", {
        data: { defaultAssignee: "Mari Astapova" },
      });
      expect(invalidResponse.status()).toBe(400);
      const invalidError = await readApiError(invalidResponse);
      expect(invalidError.code).toBe("VALIDATION_ERROR");
    });
  });

  test.describe("Anonymous", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("cannot read or update settings", async ({ settingsApi }) => {
      const getResponse = await settingsApi.getSettings();
      expect(getResponse.status()).toBe(401);
      expect((await readApiError(getResponse)).code).toBe("UNAUTHORIZED");

      const patchResponse = await settingsApi.updateSettings({
        defaultAssignee: "Chris",
      });
      expect(patchResponse.status()).toBe(401);
      expect((await readApiError(patchResponse)).code).toBe("UNAUTHORIZED");
    });
  });
});
