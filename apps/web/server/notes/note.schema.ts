import { z } from "zod";

export const noteCategorySchema = z.enum([
  "Testing",
  "Automation",
  "Investigation",
  "Bug",
  "General",
]);

export const createNoteSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(5000),
    projectId: z.uuid(),
    category: noteCategorySchema,
    pinned: z.boolean().default(false),
  })
  .strict();

export const updateNoteSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).max(5000).optional(),
    projectId: z.uuid().optional(),
    category: noteCategorySchema.optional(),
    pinned: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

/** Mirrors the database check constraint so unroutable slugs never reach a query. */
export const noteSlugParamSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export type CreateNoteInput = z.output<typeof createNoteSchema>;
export type UpdateNoteInput = z.output<typeof updateNoteSchema>;
