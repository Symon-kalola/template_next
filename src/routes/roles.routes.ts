import { Router } from "express";
import { RolesController } from "../controllers/roles.controller";
import { RoleAccessRightsController } from "../controllers/role_access_rights.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema,
} from "../validators/roles.validator";
import { assignAccessRightsSchema } from "../validators/role_access_rights.validator";

const router = Router();
router.use(authenticate);

router.get("/", RolesController.getAll);
router.post("/", validate(createRoleSchema), RolesController.create);
router.get("/:id", validate(roleIdSchema, "params"), RolesController.getById);
router.put("/:id", validate(roleIdSchema, "params"), validate(updateRoleSchema), RolesController.update);
router.delete("/:id", validate(roleIdSchema, "params"), RolesController.delete);

// Role access rights
router.get("/:id/access-rights", validate(roleIdSchema, "params"), RoleAccessRightsController.getByRoleId);
router.put("/:id/access-rights", validate(roleIdSchema, "params"), validate(assignAccessRightsSchema), RoleAccessRightsController.assign);

export default router;
