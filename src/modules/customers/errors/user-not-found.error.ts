import { BaseError } from "../../../shared/errors/base-error.js";

export class UserNotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly code = "USER_NOT_FOUND";

  constructor() {
    super("Usuário não encontrado.");
  }
}
