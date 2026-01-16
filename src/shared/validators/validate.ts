import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { ValidationError } from "../errors/index.js";

export function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const fieldErrors = errors.array().map((error) => ({
    field: error.type === "field" ? error.path : "unknown",
    message: error.msg
  }));

  const validationError = new ValidationError();
  return res.status(validationError.statusCode).json({
    message: validationError.message,
    code: validationError.code,
    errors: fieldErrors
  });
}
