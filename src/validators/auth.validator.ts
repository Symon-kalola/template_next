import { z } from "zod";

export const loginSchema = z.object({
  service_number: z.string({ required_error: "Service number is required" }).min(1),
  password: z.string({ required_error: "Password is required" }).min(1),
  device_info: z.string().optional(),
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string({ required_error: "Refresh token is required" }).min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string({ required_error: "Email is required" }).email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    service_number: z.string({ required_error: "Service number is required" }).min(1),
    otp: z.string().length(6, "OTP must be 6 digits"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(8),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
