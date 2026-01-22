import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { authMiddleware } from "../../shared/http/auth.middleware.js";
import { requireRole } from "../../shared/permissions/require-role.middleware.js";
import {
  customerIdValidator,
  listCustomersValidator,
  registerCustomerValidator,
  updateMeValidator,
  updatePermissionsValidator,
  updateStatusValidator
} from "./validators/index.js";
import { validate } from "../../shared/validators/validate.js";
import { CustomersController } from "./customers.controller.js";

const router = Router();
const controller = new CustomersController();

router.post(
  "/",
  registerCustomerValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.register(req, res, next)
);

router.get(
  "/me",
  authMiddleware,
  requireRole(["CUSTOMER"]),
  (req: Request, res: Response, next: NextFunction) =>
    controller.getMe(req, res, next)
);
router.get(
  "/me/permissions",
  authMiddleware,
  requireRole(["CUSTOMER"]),
  (req: Request, res: Response, next: NextFunction) =>
    controller.getMyPermissions(req, res, next)
);
router.patch(
  "/me",
  authMiddleware,
  requireRole(["CUSTOMER"]),
  updateMeValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.updateMe(req, res, next)
);

router.get(
  "/",
  authMiddleware,
  requireRole(["ADMIN"]),
  listCustomersValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.list(req, res, next)
);
router.get(
  "/:id",
  authMiddleware,
  requireRole(["ADMIN"]),
  customerIdValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.getById(req, res, next)
);
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["ADMIN"]),
  customerIdValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.remove(req, res, next)
);

router.patch(
  "/:id/permissions",
  authMiddleware,
  requireRole(["ADMIN"]),
  updatePermissionsValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.updatePermissions(req, res, next)
);

router.patch(
  "/:id/status",
  authMiddleware,
  requireRole(["ADMIN"]),
  updateStatusValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.updateCustomerStatus(req, res, next)
);

export { router as customersRoutes };
