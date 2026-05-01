import { Router } from "express";
import rolesRouter from "./roles.routes";
import accessRightsRouter from "./access_rights.routes";
import authRouter from "./auth.routes";
import sessionsRouter from "./sessions.routes";
import usersRouter from "./users.routes";
import shopsRouter from "./shops.routes";
import categoriesRouter from "./categories.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/sessions", sessionsRouter);
router.use("/users", usersRouter);
router.use("/shops", shopsRouter);
router.use("/categories", categoriesRouter);
router.use("/roles", rolesRouter);
router.use("/access-rights", accessRightsRouter);

export default router;
