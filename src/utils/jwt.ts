import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  userId: number;
  sessionId: number;
  roleId: string | null;
}

export const signAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });

export const verifyAccessToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  return decoded as JwtPayload;
};
