import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { authMiddleware } from "../../shared/http/auth.middleware.js";
import {
  checkEmailValidator,
  loginValidator
} from "./auth.validators.js";
import { validate } from "../../shared/validators/validate.js";
import { AuthController } from "./auth.controller.js";

const router = Router();
const controller = new AuthController();

router.post(
  "/auth/check-email",
  checkEmailValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.checkEmail(req, res, next)
);
router.post(
  "/auth/login",
  loginValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.login(req, res, next)
);
router.post(
  "/auth/logout",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) =>
    controller.logout(req, res, next)
);

export { router as authRoutes };
