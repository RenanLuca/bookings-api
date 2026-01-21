import type { NextFunction, Request, Response } from "express";
import { AuthTokenInvalidError } from "../../modules/auth/errors/index.js";
import { ForbiddenError } from "../errors/index.js";

type AllowedRole = "ADMIN" | "CUSTOMER";

const requireRole =
  (roles: Array<AllowedRole>) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthTokenInvalidError());
    }
    const hasRole = roles.includes(req.user.role as AllowedRole);
    if (!hasRole) {
      return next(new ForbiddenError());
    }
    return next();
  };

export { requireRole };
