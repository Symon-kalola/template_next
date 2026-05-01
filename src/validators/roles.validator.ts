import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  description: z.string().max(500, "Description must be at most 500 characters").trim().optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export const roleIdSchema = z.object({
  id: z.string().uuid("Invalid role ID"),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
