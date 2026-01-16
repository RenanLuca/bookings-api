import { BaseError } from "../../../shared/errors/base-error.js";

export class AuthInvalidCredentialsError extends BaseError {
  readonly statusCode = 401;
  readonly code = "AUTH_INVALID_CREDENTIALS";

  constructor() {
    super("Credenciais inválidas. Verifique e tente novamente.");
  }
}
