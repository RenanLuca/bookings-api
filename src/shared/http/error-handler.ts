import type { NextFunction, Request, Response } from "express";
import { BaseError, InternalError } from "../errors/index.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.log(`[ERROR HANDLER] Erro capturado em ${req.method} ${req.path}`);
  
  if (err instanceof BaseError) {
    console.log(`[ERROR HANDLER] BaseError: ${err.code} - ${err.message} (status: ${err.statusCode})`);
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
    });
  }

  console.error('[ERROR HANDLER] Erro não tratado:', err);

  const internalError = new InternalError();
  return res.status(internalError.statusCode).json({
    message: internalError.message,
    code: internalError.code,
  });
}
