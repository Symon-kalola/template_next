import { Router } from "express";
import { UsersController } from "../controllers/users.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { excelUpload } from "../middleware/upload.middleware";
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  changeStatusSchema,
  userFiltersSchema,
  userIdSchema,
} from "../validators/users.validator";

const router = Router();
router.use(authenticate);

// Bulk — must be before /:id to avoid route conflict
router.get("/bulk-template", UsersController.downloadTemplate);
router.post("/bulk-upload", excelUpload, UsersController.bulkUpload);

router.get("/", validate(userFiltersSchema, "query"), UsersController.getAll);
router.post("/", validate(adminCreateUserSchema), UsersController.adminCreate);
router.get("/:id", validate(userIdSchema, "params"), UsersController.getById);
router.put("/:id", validate(userIdSchema, "params"), validate(adminUpdateUserSchema), UsersController.update);
router.patch("/:id/status", validate(userIdSchema, "params"), validate(changeStatusSchema), UsersController.changeStatus);

export default router;
