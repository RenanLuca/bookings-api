import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { UserRole } from "../../models/user.model.js";
import { AuthTokenInvalidError } from "../../modules/auth/auth.errors.js";
import { AuthRepository } from "../../modules/auth/auth.repository.js";

const repository = new AuthRepository();

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(new AuthTokenInvalidError());
  }
  const token = authorization.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    if (
      typeof payload !== "object" ||
      payload.userId === undefined ||
      payload.role === undefined ||
      payload.email === undefined
    ) {
      return next(new AuthTokenInvalidError());
    }
    const activeToken = await repository.findActiveToken(
      token,
      Number(payload.userId)
    );
    if (!activeToken) {
      return next(new AuthTokenInvalidError());
    }
    req.user = {
      userId: Number(payload.userId),
      role: payload.role as UserRole,
      email: String(payload.email),
      token
    };
    return next();
  } catch (error) {
    return next(new AuthTokenInvalidError());
  }
};

export { authMiddleware };
