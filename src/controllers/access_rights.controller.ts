import { Request, Response, NextFunction } from "express";
import { AccessRightModel } from "../models/access_rights.model";

export const AccessRightsController = {
  getAll: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await AccessRightModel.findAll();
      res.json({ success: true, message: "Access rights fetched", data });
    } catch (err) {
      next(err);
    }
  },
};
