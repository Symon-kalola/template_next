import { Request, Response, NextFunction } from "express";
import { UserSessionModel } from "../models/user_sessions.model";
import { AppError } from "../middleware/error.middleware";
import { SessionFiltersInput } from "../validators/sessions.validator";
import { SessionStatus } from "../db/schema";

export const SessionsController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, user_id, status, start_date, end_date } =
        req.query as unknown as SessionFiltersInput;

      const data = await UserSessionModel.findAll({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        userId: user_id ? Number(user_id) : undefined,
        status: status as SessionStatus | undefined,
        startDate: start_date,
        endDate: end_date,
      });

      res.json({ success: true, message: "Sessions fetched", data });
    } catch (err) {
      next(err);
    }
  },

  deactivate: async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const session = await UserSessionModel.findById(id);
      if (!session) throw new AppError("Session not found", 404);
      if (session.status === "deactivated")
        throw new AppError("Session is already deactivated", 409);

      const updated = await UserSessionModel.updateStatus(id, "deactivated");
      res.json({ success: true, message: "Session deactivated", data: updated });
    } catch (err) {
      next(err);
    }
  },
};
