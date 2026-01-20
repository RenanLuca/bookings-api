import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { authMiddleware } from "../../shared/http/auth.middleware.js";
import { requireRole } from "../../shared/http/require-role.middleware.js";
import { requirePermission } from "../../shared/http/require-permission.middleware.js";
import { listLogsValidator } from "./validators/index.js";
import { validate } from "../../shared/validators/validate.js";
import { LogsController } from "./logs.controller.js";

const router = Router();
const controller = new LogsController();

router.use(authMiddleware);

router.get(
  "/",
  requireRole(["ADMIN"]),
  listLogsValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.listAll(req, res, next)
);

router.get(
  "/me",
  requireRole(["CUSTOMER"]),
  requirePermission("LOGS"),
  listLogsValidator,
  validate,
  (req: Request, res: Response, next: NextFunction) =>
    controller.listMine(req, res, next)
);

export { router as logsRoutes };
