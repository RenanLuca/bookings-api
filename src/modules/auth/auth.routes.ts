import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { authMiddleware } from "../../shared/http/auth.middleware.js";
import {
  checkEmailValidator,
  loginValidator
} from "./validators/index.js";
import { validate } from "../../shared/validators/validate.js";
import { AuthController } from "./auth.controller.js";

const router = Router();
const controller = new AuthController();

router.post(
  "/check-email",
  checkEmailValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.checkEmail(req, res, next)
);
router.post(
  "/login/admin",
  loginValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.loginAdmin(req, res, next)
);
router.post(
  "/login/customer",
  loginValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.loginCustomer(req, res, next)
);
router.post(
  "/logout",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) =>
    controller.logout(req, res, next)
);

export { router as authRoutes };
