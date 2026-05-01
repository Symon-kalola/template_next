import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(1),
  parent_id: z.number().int().positive().optional().nullable(),
  icon_url: z.string().url("Invalid icon URL").optional().nullable(),
  banner_url: z.string().url("Invalid banner URL").optional().nullable(),
  display_order: z.number().int().min(0).default(0),
  return_window_days: z.number().int().positive().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const changeCategoryStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const categoryIdSchema = z.object({
  id: z.coerce.number().int().positive("Invalid category ID"),
});

export const categoryFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(["active", "inactive"]).optional(),
  parent_id: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
