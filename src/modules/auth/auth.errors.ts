import { BaseError } from "../../shared/errors/base-error.js";

export class AuthInvalidCredentialsError extends BaseError {
  readonly statusCode = 401;
  readonly code = "AUTH_INVALID_CREDENTIALS";

  constructor() {
    super("Credenciais inválidas. Verifique e tente novamente.");
  }
}

export class AuthTokenInvalidError extends BaseError {
  readonly statusCode = 401;
  readonly code = "AUTH_TOKEN_INVALID";

  constructor() {
    super("Sessão inválida ou expirada. Faça login novamente.");
  }
}

export class AuthUserInactiveError extends BaseError {
  readonly statusCode = 403;
  readonly code = "AUTH_USER_INACTIVE";

  constructor() {
    super("Sua conta está inativa. Entre em contato com o suporte.");
  }
}
