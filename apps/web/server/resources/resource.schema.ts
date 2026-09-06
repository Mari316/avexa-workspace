import { z } from "zod";

export const resourceTypeSchema = z.enum([
  "Repository",
  "API Docs",
  "Environment",
  "Test Management",
  "Documentation",
  "Other",
]);

export const resourceStatusSchema = z.enum(["Active", "Inactive"]);

export function isAbsoluteHttpUrl(value: string): boolean {
  if (value.startsWith("//")) {
    return false;
  }

  try {
    const parsed = new URL(value);

    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname.length > 0
    );
  } catch {
    return false;
  }
}

export const resourceUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine(isAbsoluteHttpUrl, {
    message: "URL must be an absolute http:// or https:// address.",
  });

export const createResourceSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    url: resourceUrlSchema,
    type: resourceTypeSchema,
    status: resourceStatusSchema.optional(),
    projectId: z.uuid(),
  })
  .strict();

export const updateResourceSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    url: resourceUrlSchema.optional(),
    type: resourceTypeSchema.optional(),
    status: resourceStatusSchema.optional(),
    projectId: z.uuid().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const resourceIdParamSchema = z.uuid();

export type CreateResourceInput = z.output<typeof createResourceSchema>;
export type UpdateResourceInput = z.output<typeof updateResourceSchema>;
