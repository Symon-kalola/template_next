import { Router } from "express";
import { CategoriesController } from "../controllers/categories.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { excelUpload } from "../middleware/upload.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
  changeCategoryStatusSchema,
  categoryIdSchema,
  categoryFiltersSchema,
} from "../validators/categories.validator";

const router = Router();
router.use(authenticate);

// Static routes — must come before /:id
router.get("/bulk-template", CategoriesController.downloadTemplate);
router.post("/bulk-upload", excelUpload, CategoriesController.bulkUpload);

router.get("/", validate(categoryFiltersSchema, "query"), CategoriesController.getAll);
router.post("/", validate(createCategorySchema), CategoriesController.create);
router.get("/:id", validate(categoryIdSchema, "params"), CategoriesController.getById);
router.put("/:id", validate(categoryIdSchema, "params"), validate(updateCategorySchema), CategoriesController.update);
router.delete("/:id", validate(categoryIdSchema, "params"), CategoriesController.delete);
router.patch("/:id/status", validate(categoryIdSchema, "params"), validate(changeCategoryStatusSchema), CategoriesController.changeStatus);

export default router;
