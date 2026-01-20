import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { authMiddleware } from "../../shared/http/auth.middleware.js";
import { requireRole } from "../../shared/http/require-role.middleware.js";
import {
  createRoomValidator,
  listRoomsValidator,
  roomIdValidator,
  updateRoomValidator
} from "./validators/index.js";
import { validate } from "../../shared/validators/validate.js";
import { RoomsController } from "./rooms.controller.js";

const router = Router();
const controller = new RoomsController();

router.use(authMiddleware);

router.get(
  "/",
  requireRole(["ADMIN", "CUSTOMER"]),
  listRoomsValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.list(req, res, next)
);
router.get(
  "/:id",
  requireRole(["ADMIN"]),
  roomIdValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.getById(req, res, next)
);
router.post(
  "/",
  requireRole(["ADMIN"]),
  createRoomValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.create(req, res, next)
);
router.patch(
  "/:id",
  requireRole(["ADMIN"]),
  updateRoomValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.update(req, res, next)
);
router.delete(
  "/:id",
  requireRole(["ADMIN"]),
  roomIdValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.remove(req, res, next)
);

export { router as roomsRoutes };
