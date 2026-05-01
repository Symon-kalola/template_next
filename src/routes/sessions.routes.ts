import { Router } from "express";
import { SessionsController } from "../controllers/sessions.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { sessionFiltersSchema, sessionIdSchema } from "../validators/sessions.validator";

const router = Router();

router.use(authenticate);

router.get("/", validate(sessionFiltersSchema, "query"), SessionsController.getAll);
router.put("/:id/deactivate", validate(sessionIdSchema, "params"), SessionsController.deactivate);

export default router;
