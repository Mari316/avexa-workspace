import { eq } from "drizzle-orm";

import { db } from "../db";
import { userSettings } from "../db/schema";
import { toUserSettingsDTO, type UserSettingsDTO } from "./settings.dto";
import type { UpdateUserSettingsInput } from "./settings.schema";

export async function getUserSettings(userId: string): Promise<UserSettingsDTO> {
  const [row] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return toUserSettingsDTO(row ?? null);
}

export async function updateUserSettings(
  userId: string,
  patch: UpdateUserSettingsInput,
): Promise<UserSettingsDTO> {
  const [existing] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (!existing) {
    await db.insert(userSettings).values({
      userId,
      defaultAssignee:
        patch.defaultAssignee !== undefined ? patch.defaultAssignee : null,
      defaultEnvironment:
        patch.defaultEnvironment !== undefined
          ? patch.defaultEnvironment
          : null,
    });

    return getUserSettings(userId);
  }

  await db
    .update(userSettings)
    .set({
      updatedAt: new Date(),
      ...(patch.defaultAssignee !== undefined && {
        defaultAssignee: patch.defaultAssignee,
      }),
      ...(patch.defaultEnvironment !== undefined && {
        defaultEnvironment: patch.defaultEnvironment,
      }),
    })
    .where(eq(userSettings.userId, userId));

  return getUserSettings(userId);
}
