import { z } from "zod";

export const contactStatusSchema = z.enum(["Active", "Inactive"]);

export const createContactSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    clientId: z.uuid(),
    email: z.email().max(200),
    role: z.string().trim().min(1).max(120),
    status: contactStatusSchema.default("Active"),
  })
  .strict();

export const updateContactSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    clientId: z.uuid().optional(),
    email: z.email().max(200).optional(),
    role: z.string().trim().min(1).max(120).optional(),
    status: contactStatusSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

/** Mirrors the database check constraint so unroutable slugs never reach a query. */
export const contactSlugParamSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export type CreateContactInput = z.output<typeof createContactSchema>;
export type UpdateContactInput = z.output<typeof updateContactSchema>;
