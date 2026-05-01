import { Request, Response, NextFunction } from "express";
import { RoleModel } from "../models/roles.model";
import { AccessRightModel } from "../models/access_rights.model";
import { RoleAccessRightModel } from "../models/role_access_rights.model";
import { AppError } from "../middleware/error.middleware";
import { AssignAccessRightsInput } from "../validators/role_access_rights.validator";

type IdParams = { id: string };

export const RoleAccessRightsController = {
  getByRoleId: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = await RoleModel.findById(req.params.id);
      if (!role) throw new AppError("Role not found", 404);
      const data = await RoleAccessRightModel.findByRoleId(req.params.id);
      res.json({ success: true, message: "Access rights fetched", data });
    } catch (err) {
      next(err);
    }
  },

  assign: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = await RoleModel.findById(req.params.id);
      if (!role) throw new AppError("Role not found", 404);

      const { accessRightIds } = req.body as AssignAccessRightsInput;

      if (accessRightIds.length > 0) {
        const allExist = await AccessRightModel.existsByIds(accessRightIds);
        if (!allExist) throw new AppError("One or more access right IDs are invalid", 400);
      }

      await RoleAccessRightModel.replaceForRole(req.params.id, accessRightIds);
      const accessRights = await RoleAccessRightModel.findByRoleId(req.params.id);

      res.json({
        success: true,
        message: "Access rights assigned",
        data: { ...role, accessRights },
      });
    } catch (err) {
      next(err);
    }
  },
};
