import { z } from "zod";

export const sessionFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  user_id: z.coerce.number().int().positive().optional(),
  status: z.enum(["active", "deactivated", "logged_out", "expired"]).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const sessionIdSchema = z.object({
  id: z.coerce.number().int().positive("Invalid session ID"),
});

export type SessionFiltersInput = z.infer<typeof sessionFiltersSchema>;
