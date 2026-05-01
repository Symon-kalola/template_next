import { Request, Response, NextFunction } from "express";
import { RoleModel } from "../models/roles.model";
import { RoleAccessRightModel } from "../models/role_access_rights.model";
import { AppError } from "../middleware/error.middleware";
import { CreateRoleInput, UpdateRoleInput } from "../validators/roles.validator";

type IdParams = { id: string };

export const RolesController = {
  getAll: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await RoleModel.findAll();
      res.json({ success: true, message: "Roles fetched", data });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = await RoleModel.findById(req.params.id);
      if (!role) throw new AppError("Role not found", 404);
      const accessRights = await RoleAccessRightModel.findByRoleId(req.params.id);
      res.json({ success: true, message: "Role fetched", data: { ...role, accessRights } });
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as CreateRoleInput;
      const existing = await RoleModel.findByName(body.name);
      if (existing) throw new AppError("Role with this name already exists", 409);
      const role = await RoleModel.create(body);
      res.status(201).json({ success: true, message: "Role created", data: role });
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as UpdateRoleInput;
      if (body.name) {
        const existing = await RoleModel.findByName(body.name);
        if (existing && existing.id !== req.params.id)
          throw new AppError("Role with this name already exists", 409);
      }
      const role = await RoleModel.update(req.params.id, body);
      if (!role) throw new AppError("Role not found", 404);
      res.json({ success: true, message: "Role updated", data: role });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = await RoleModel.delete(req.params.id);
      if (!role) throw new AppError("Role not found", 404);
      res.json({ success: true, message: "Role deleted", data: role });
    } catch (err) {
      next(err);
    }
  },
};
