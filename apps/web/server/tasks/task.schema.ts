import { z } from "zod";

export const taskStatusSchema = z.enum([
  "To Do",
  "In Progress",
  "Review",
  "Blocked",
  "Done",
]);

export const taskPrioritySchema = z.enum(["High", "Medium", "Low"]);

/** Temporary until Users/auth: matches the Add/Edit Task assignee options. */
export const taskAssigneeSchema = z.enum(["Mari", "Chris", "Alex"]);

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD.");

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    projectId: z.uuid(),
    assignee: taskAssigneeSchema,
    dueDate: isoDateSchema,
    priority: taskPrioritySchema.default("Medium"),
    status: taskStatusSchema.default("To Do"),
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    projectId: z.uuid().optional(),
    assignee: taskAssigneeSchema.optional(),
    dueDate: isoDateSchema.optional(),
    priority: taskPrioritySchema.optional(),
    status: taskStatusSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

/** Mirrors the database check constraint so unroutable slugs never reach a query. */
export const taskSlugParamSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export type CreateTaskInput = z.output<typeof createTaskSchema>;
export type UpdateTaskInput = z.output<typeof updateTaskSchema>;
