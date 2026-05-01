import crypto from "crypto";

export const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const hashOtp = (otp: string): string =>
  crypto.createHash("sha256").update(otp).digest("hex");

export const verifyOtp = (otp: string, hash: string): boolean =>
  hashOtp(otp) === hash;
