import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { UserRole } from "../../models/user.model.js";
import { AuthTokenInvalidError } from "../../modules/auth/errors/index.js";
import { RepositoryFactory } from "../factories/repository.factory.js";

const authRepository = RepositoryFactory.getAuthRepository();

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(new AuthTokenInvalidError());
  }

  const token = authorization.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (!decoded || typeof decoded !== "object") {
      return next(new AuthTokenInvalidError());
    }

    const payload = decoded as jwt.JwtPayload;

    const userId = Number(payload.userId);
    const role = payload.role;
    const email = payload.email;

    if (
      !Number.isFinite(userId) ||
      typeof role !== "string" ||
      typeof email !== "string"
    ) {
      return next(new AuthTokenInvalidError());
    }

    const activeToken = await authRepository.findActiveToken(token, userId);

    if (!activeToken) {
      return next(new AuthTokenInvalidError());
    }

    req.user = {
      userId,
      role: role as UserRole,
      email,
      token
    };

    return next();
  } catch {
    return next(new AuthTokenInvalidError());
  }
};
