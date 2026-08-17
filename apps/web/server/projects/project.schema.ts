import { z } from "zod";

export const projectStatusSchema = z.enum(["Active", "On Hold"]);

export const projectEnvironmentSchema = z.enum([
  "Development",
  "QA",
  "Staging",
  "Production",
  "Demo",
]);

export const createProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    clientId: z.uuid(),
    environment: projectEnvironmentSchema,
    status: projectStatusSchema.default("Active"),
  })
  .strict();

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    clientId: z.uuid().optional(),
    environment: projectEnvironmentSchema.optional(),
    status: projectStatusSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

/** Mirrors the database check constraint so unroutable slugs never reach a query. */
export const projectSlugParamSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export type CreateProjectInput = z.output<typeof createProjectSchema>;
export type UpdateProjectInput = z.output<typeof updateProjectSchema>;
