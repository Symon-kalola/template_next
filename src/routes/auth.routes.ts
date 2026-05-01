import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";
import { registerSchema } from "../validators/users.validator";

const router = Router();

router.post("/login", validate(loginSchema), AuthController.login);
router.post("/logout", authenticate, AuthController.logout);
router.post("/register", validate(registerSchema), AuthController.register);
router.post("/refresh-token", validate(refreshTokenSchema), AuthController.refreshToken);
router.post("/forgot-password", validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), AuthController.resetPassword);

export default router;
