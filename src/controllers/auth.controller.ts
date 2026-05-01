import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/users.model";
import { UserSessionModel } from "../models/user_sessions.model";
import { AppError } from "../middleware/error.middleware";
import { comparePassword, hashPassword } from "../utils/hash";
import { signAccessToken } from "../utils/jwt";
import { generateOtp, hashOtp, verifyOtp } from "../utils/otp";
import { addEmailJob } from "../queues/email.queue";
import { env } from "../config/env";
import {
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../validators/auth.validator";
import { RegisterInput } from "../validators/users.validator";

const REFRESH_EXPIRES_MS = (env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7) * 24 * 60 * 60 * 1000;

export const AuthController = {
  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { service_number, password, device_info, location, lat, lng } =
        req.body as LoginInput;

      const user = await UserModel.findByServiceNumber(service_number);
      if (!user) throw new AppError("Invalid credentials", 401);

      if (user.status !== "active")
        throw new AppError(`Account is ${user.status}. Contact administrator.`, 403);

      if (!user.passwordHash) throw new AppError("Invalid credentials", 401);
      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) throw new AppError("Invalid credentials", 401);

      await UserSessionModel.logoutAllActive(user.id);

      const refreshToken = crypto.randomBytes(48).toString("hex");
      const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS);

      const session = await UserSessionModel.create({
        userId: user.id,
        deviceInfo: device_info ?? (req.headers["user-agent"] as string) ?? null,
        ipAddress: req.ip ?? null,
        expiresAt,
        refreshToken,
        location: location ?? null,
        status: "active",
        lat: lat ?? null,
        lng: lng ?? null,
      });

      const accessToken = signAccessToken({
        userId: user.id,
        sessionId: session.id,
        roleId: user.roleId ?? null,
      });

      res.json({
        success: true,
        message: "Login successful",
        data: { accessToken, refreshToken, user: UserModel.sanitize(user) },
      });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await UserSessionModel.updateStatus(req.authSession!.id, "logged_out");
      res.json({ success: true, message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  },

  refreshToken: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refresh_token } = req.body as { refresh_token: string };

      const session = await UserSessionModel.findByRefreshToken(refresh_token);
      if (!session) throw new AppError("Invalid refresh token", 401);

      if (session.status !== "active") throw new AppError("Session is no longer active", 401);

      if (new Date() > session.expiresAt) {
        await UserSessionModel.updateStatus(session.id, "expired");
        throw new AppError("Session expired, please login again", 401);
      }

      const user = await UserModel.findById(session.userId);
      if (!user || user.status !== "active")
        throw new AppError("User not found or inactive", 401);

      const newRefreshToken = crypto.randomBytes(48).toString("hex");
      const newExpiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS);

      await UserSessionModel.updateRefreshToken(session.id, newRefreshToken, newExpiresAt);

      const accessToken = signAccessToken({
        userId: user.id,
        sessionId: session.id,
        roleId: user.roleId ?? null,
      });

      res.json({
        success: true,
        message: "Token refreshed",
        data: { accessToken, refreshToken: newRefreshToken },
      });
    } catch (err) {
      next(err);
    }
  },

  forgotPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body as ForgotPasswordInput;

      const SUCCESS_MSG = "If the email exists, an OTP has been sent";

      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.json({ success: true, message: SUCCESS_MSG });
        return;
      }

      const otp = generateOtp();
      const otpHash = hashOtp(otp);
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await UserModel.setOtp(user.id, otpHash, otpExpiresAt);

      await addEmailJob({
        to: email,
        subject: "Password Reset OTP",
        html: `
          <p>Hello ${user.firstName ?? user.lastName},</p>
          <p>Your OTP for password reset is:</p>
          <h2 style="letter-spacing:4px">${otp}</h2>
          <p>This OTP expires in <strong>10 minutes</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });

      res.json({ success: true, message: SUCCESS_MSG });
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { service_number, otp, new_password } = req.body as ResetPasswordInput;

      const user = await UserModel.findByServiceNumber(service_number);
      if (!user || !user.otpHash || !user.otpExpiresAt)
        throw new AppError("Invalid or expired OTP", 400);

      if (new Date() > user.otpExpiresAt) throw new AppError("OTP has expired", 400);

      if (!verifyOtp(otp, user.otpHash)) throw new AppError("Invalid OTP", 400);

      const passwordHash = await hashPassword(new_password);
      await UserModel.updatePassword(user.id, passwordHash);

      res.json({ success: true, message: "Password reset successfully" });
    } catch (err) {
      next(err);
    }
  },

  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { service_number, email, password } = req.body as RegisterInput;

      const user = await UserModel.findByServiceNumber(service_number);
      if (!user) throw new AppError("Service number not found. Contact your administrator.", 404);
      if (user.status !== "pending")
        throw new AppError("This account has already been registered.", 400);

      const emailUser = await UserModel.findByEmail(email);
      if (emailUser) throw new AppError("Email is already in use.", 409);

      const passwordHash = await hashPassword(password);
      const updated = await UserModel.register(user.id, email, passwordHash);

      res.status(201).json({
        success: true,
        message: "Registration successful. You can now login.",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};
