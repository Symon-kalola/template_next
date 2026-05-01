import { Request, Response, NextFunction } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwt";
import { UserSessionModel } from "../models/user_sessions.model";
import { AppError } from "./error.middleware";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) throw new AppError("Unauthorized", 401);

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    const session = await UserSessionModel.findById(payload.sessionId);
    if (!session || session.status !== "active") throw new AppError("Session is no longer active", 401);

    if (new Date() > session.expiresAt) {
      await UserSessionModel.updateStatus(session.id, "expired");
      throw new AppError("Session expired, please login again", 401);
    }

    req.user = { userId: payload.userId, sessionId: payload.sessionId, roleId: payload.roleId };
    req.authSession = session;
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError)
      return next(new AppError("Access token expired, please refresh", 401));
    if (err instanceof JsonWebTokenError)
      return next(new AppError("Invalid access token", 401));
    next(err);
  }
};
