import { BaseError } from "../../../shared/errors/base-error.js";

export class UserEmailAlreadyExistsError extends BaseError {
  readonly statusCode = 409;
  readonly code = "USER_EMAIL_ALREADY_EXISTS";

  constructor() {
    super("Já existe um usuário com este e-mail.");
  }
}
