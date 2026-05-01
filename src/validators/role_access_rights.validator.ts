import { z } from "zod";

export const assignAccessRightsSchema = z.object({
  accessRightIds: z
    .array(z.number({ invalid_type_error: "Each ID must be a number" }).int().positive())
    .min(0),
});

export type AssignAccessRightsInput = z.infer<typeof assignAccessRightsSchema>;
