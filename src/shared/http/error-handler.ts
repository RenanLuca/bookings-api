import type { NextFunction, Request, Response } from "express";
import { BaseError, InternalError } from "../errors/index.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof BaseError) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
    });
  }

  console.error(err);

  const internalError = new InternalError();
  return res.status(internalError.statusCode).json({
    message: internalError.message,
    code: internalError.code,
  });
}
