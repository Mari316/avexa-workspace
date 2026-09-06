import { readApiError } from "../../api/errors.js";
import {
  parseTeamMember,
  readTeamRecords,
} from "../../api/team.api.js";
import { expect, test } from "../../fixtures/test.js";

const SENSITIVE_FIELD = /password|account|session|token/i;

test.describe("Team API", () => {
  test.describe("Admin (Mari)", () => {
    test.use({ storageState: "./.auth/mari.json" });

    test("returns the seeded Better Auth users", async ({ teamApi }) => {
      const response = await teamApi.getTeam();
      expect(response.status()).toBe(200);

      const records = await readTeamRecords(response);
      const members = records.map((record, index) =>
        parseTeamMember(record, index),
      );

      for (const record of records) {
        const leaked = Object.keys(record).filter((key) =>
          SENSITIVE_FIELD.test(key),
        );
        expect(leaked).toEqual([]);
      }

      for (const member of members) {
        expect(typeof member.id).toBe("string");
        expect(typeof member.email).toBe("string");
        expect(typeof member.createdAt).toBe("string");
      }

      const mari = members.find((member) => member.name === "Mari Astapova");
      const chris = members.find((member) => member.name === "Chris Miller");
      const alex = members.find((member) => member.name === "Alex Brown");

      expect(mari?.role).toBe("admin");
      expect(mari?.email).toBe("mari@avexa.test");
      expect(chris?.role).toBe("qa_engineer");
      expect(chris?.email).toBe("chris@avexa.test");
      expect(alex?.role).toBe("viewer");
      expect(alex?.email).toBe("alex@avexa.test");
    });
  });

  test.describe("Viewer (Alex)", () => {
    test.use({ storageState: "./.auth/alex.json" });

    test("can read the team", async ({ teamApi }) => {
      const response = await teamApi.getTeam();
      expect(response.status()).toBe(200);
    });
  });

  test.describe("Anonymous", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("cannot read the team", async ({ teamApi }) => {
      const response = await teamApi.getTeam();
      expect(response.status()).toBe(401);

      const error = await readApiError(response);
      expect(error.code).toBe("UNAUTHORIZED");
    });
  });
});
