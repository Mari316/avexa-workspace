import { z } from "zod";

import { projectEnvironmentSchema } from "../projects/project.schema";
import { taskAssigneeSchema } from "../tasks/task.schema";

export const updateUserSettingsSchema = z
  .object({
    defaultAssignee: taskAssigneeSchema.nullable().optional(),
    defaultEnvironment: projectEnvironmentSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export type UpdateUserSettingsInput = z.output<typeof updateUserSettingsSchema>;
