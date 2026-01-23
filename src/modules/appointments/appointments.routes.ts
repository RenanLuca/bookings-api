import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { authMiddleware } from "../../shared/http/auth.middleware.js";
import { requireRole } from "../../shared/permissions/require-role.middleware.js";
import {
  appointmentIdValidator,
  createAppointmentValidator,
  listAppointmentsValidator
} from "./validators/index.js";
import { validate } from "../../shared/validators/validate.js";
import { AppointmentsController } from "./appointments.controller.js";

const router = Router();
const controller = new AppointmentsController();
router.use(authMiddleware);

router.post(
  "/",
  requireRole(["CUSTOMER"]),
  createAppointmentValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.create(req, res, next)
);

router.get(
  "/me",
  requireRole(["CUSTOMER"]),
  listAppointmentsValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.listMine(req, res, next)
);

router.get(
  "/",
  requireRole(["ADMIN"]),
  listAppointmentsValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.listAll(req, res, next)
);

router.patch(
  "/:id/accept",
  requireRole(["ADMIN"]),
  appointmentIdValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.accept(req, res, next)
);

router.patch(
  "/:id/cancel",
  requireRole(["ADMIN", "CUSTOMER"]),
  appointmentIdValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.cancel(req, res, next)
);

export { router as appointmentsRoutes };
