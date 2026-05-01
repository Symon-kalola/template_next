import { Router } from "express";
import { ShopsController } from "../controllers/shops.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { excelUpload } from "../middleware/upload.middleware";
import {
  createShopSchema,
  updateShopSchema,
  changeShopStatusSchema,
  shopIdSchema,
  shopFiltersSchema,
  addShopAdminsSchema,
  removeShopAdminsSchema,
} from "../validators/shops.validator";

const router = Router();
router.use(authenticate);

// Static routes — must come before /:id
router.get("/bulk-template", ShopsController.downloadTemplate);
router.post("/bulk-upload", excelUpload, ShopsController.bulkUpload);

router.get("/", validate(shopFiltersSchema, "query"), ShopsController.getAll);
router.post("/", validate(createShopSchema), ShopsController.create);
router.get("/:id", validate(shopIdSchema, "params"), ShopsController.getById);
router.put("/:id", validate(shopIdSchema, "params"), validate(updateShopSchema), ShopsController.update);
router.delete("/:id", validate(shopIdSchema, "params"), ShopsController.delete);
router.patch("/:id/status", validate(shopIdSchema, "params"), validate(changeShopStatusSchema), ShopsController.changeStatus);

// Shop admins
router.get("/:id/admins", validate(shopIdSchema, "params"), ShopsController.getAdmins);
router.post("/:id/admins", validate(shopIdSchema, "params"), validate(addShopAdminsSchema), ShopsController.addAdmins);
router.delete("/:id/admins", validate(shopIdSchema, "params"), validate(removeShopAdminsSchema), ShopsController.removeAdmins);

export default router;
