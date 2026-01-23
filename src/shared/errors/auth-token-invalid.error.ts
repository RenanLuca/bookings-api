import { BaseError } from "./base-error.js";

export class AuthTokenInvalidError extends BaseError {
  readonly statusCode = 401;
  readonly code = "AUTH_TOKEN_INVALID";

  constructor() {
    super("Sessão inválida ou expirada. Faça login novamente.");
  }
}
