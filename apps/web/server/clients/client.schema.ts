import { z } from "zod";

export const clientStatusSchema = z.enum(["Active", "On Hold"]);

export const createClientSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    status: clientStatusSchema.default("Active"),
  })
  .strict();

export const updateClientSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    status: clientStatusSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

/** Mirrors the database check constraint so unroutable slugs never reach a query. */
export const clientSlugParamSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export type CreateClientInput = z.output<typeof createClientSchema>;
export type UpdateClientInput = z.output<typeof updateClientSchema>;
