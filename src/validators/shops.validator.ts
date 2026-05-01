import { z } from "zod";

export const createShopSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(1),
  description: z.string().optional(),
  image_url: z.string().url("Invalid image URL").optional(),
  unit: z.string().optional(),
  geo_lat: z.number().min(-90).max(90).optional(),
  geo_long: z.number().min(-180).max(180).optional(),
});

export const updateShopSchema = createShopSchema.partial();

export const changeShopStatusSchema = z.object({
  status: z.enum(["active", "inactive", "suspended"]),
});

export const shopIdSchema = z.object({
  id: z.coerce.number().int().positive("Invalid shop ID"),
});

export const shopFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  search: z.string().optional(),
});

export const addShopAdminsSchema = z.object({
  admins: z
    .array(
      z.object({
        user_id: z.number().int().positive(),
        is_primary_admin: z.boolean().default(false),
      }),
    )
    .min(1, "At least one admin is required"),
});

export const removeShopAdminsSchema = z.object({
  user_ids: z.array(z.number().int().positive()).min(1, "At least one user ID is required"),
});

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
export type AddShopAdminsInput = z.infer<typeof addShopAdminsSchema>;
export type RemoveShopAdminsInput = z.infer<typeof removeShopAdminsSchema>;
