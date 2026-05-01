import { Router } from "express";
import { AccessRightsController } from "../controllers/access_rights.controller";

const router = Router();

router.get("/", AccessRightsController.getAll);

export default router;
