import { BaseError } from "./base-error.js";

export class ForbiddenError extends BaseError {
  readonly statusCode = 403;
  readonly code = "FORBIDDEN";

  constructor() {
    super("Você não tem permissão para acessar este recurso.");
  }
}

export class ValidationError extends BaseError {
  readonly statusCode = 400;
  readonly code = "VALIDATION_ERROR";

  constructor() {
    super("Os dados enviados são inválidos. Revise e tente novamente.");
  }
}

export class InternalError extends BaseError {
  readonly statusCode = 500;
  readonly code = "INTERNAL_SERVER_ERROR";

  constructor() {
    super("Erro interno do servidor. Tente novamente mais tarde.");
  }
}
