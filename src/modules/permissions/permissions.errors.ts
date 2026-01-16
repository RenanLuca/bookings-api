import { BaseError } from "../../shared/errors/base-error.js";

export class ModuleAccessForbiddenError extends BaseError {
  readonly statusCode = 403;
  readonly code = "MODULE_ACCESS_FORBIDDEN";

  constructor() {
    super("Você não tem permissão para acessar este módulo.");
  }
}
