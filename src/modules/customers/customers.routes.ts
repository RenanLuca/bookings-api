import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { authMiddleware } from "../../shared/http/auth.middleware.js";
import { requireRole } from "../../shared/http/require-role.middleware.js";
import {
  customerIdValidator,
  listCustomersValidator,
  registerCustomerValidator,
  updateMeValidator,
  updatePermissionsValidator
} from "./customers.validators.js";
import { validate } from "../../shared/validators/validate.js";
import { CustomersController } from "./customers.controller.js";

const router = Router();
const controller = new CustomersController();

router.post(
  "/customers",
  registerCustomerValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.register(req, res, next)
);

router.get(
  "/customers/me",
  authMiddleware,
  requireRole(["CUSTOMER"]),
  (req: Request, res: Response, next: NextFunction) =>
    controller.getMe(req, res, next)
);
router.patch(
  "/customers/me",
  authMiddleware,
  requireRole(["CUSTOMER"]),
  updateMeValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.updateMe(req, res, next)
);

router.get(
  "/customers",
  authMiddleware,
  requireRole(["ADMIN"]),
  listCustomersValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.list(req, res, next)
);
router.get(
  "/customers/:id",
  authMiddleware,
  requireRole(["ADMIN"]),
  customerIdValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.getById(req, res, next)
);
router.delete(
  "/customers/:id",
  authMiddleware,
  requireRole(["ADMIN"]),
  customerIdValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.remove(req, res, next)
);

router.patch(
  "/customers/:id/permissions",
  authMiddleware,
  requireRole(["ADMIN"]),
  updatePermissionsValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.updatePermissions(req, res, next)
);

export { router as customersRoutes };
