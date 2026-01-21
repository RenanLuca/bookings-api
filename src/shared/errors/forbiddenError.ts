import { BaseError } from "./base-error.js";

export class ForbiddenError extends BaseError {
  readonly statusCode = 403;
  readonly code = "FORBIDDEN";

  constructor() {
    super("Você não tem permissão para acessar este recurso.");
  }
}




