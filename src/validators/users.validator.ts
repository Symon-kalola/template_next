import { z } from "zod";

export const registerSchema = z
  .object({
    service_number: z.string({ required_error: "Service number is required" }).min(1),
    email: z.string({ required_error: "Email is required" }).email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(8),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const adminCreateUserSchema = z.object({
  service_number: z.string({ required_error: "Service number is required" }).min(1),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  rank: z.string().optional(),
  unit: z.string().optional(),
  role_id: z.string().uuid("Invalid role ID").optional(),
});

export const adminUpdateUserSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  rank: z.string().optional(),
  unit: z.string().optional(),
  role_id: z.string().uuid("Invalid role ID").optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(["pending", "active", "deactivated", "suspended"]),
});

export const userFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(["pending", "active", "deactivated", "suspended"]).optional(),
  role_id: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive("Invalid user ID"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type UserFiltersInput = z.infer<typeof userFiltersSchema>;
