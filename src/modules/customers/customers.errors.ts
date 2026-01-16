import { BaseError } from "../../shared/errors/base-error.js";

export class CustomerNotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly code = "CUSTOMER_NOT_FOUND";

  constructor() {
    super("Cliente não encontrado.");
  }
}

export class UserNotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly code = "USER_NOT_FOUND";

  constructor() {
    super("Usuário não encontrado.");
  }
}

export class UserEmailAlreadyExistsError extends BaseError {
  readonly statusCode = 409;
  readonly code = "USER_EMAIL_ALREADY_EXISTS";

  constructor() {
    super("Já existe um usuário com este e-mail.");
  }
}
