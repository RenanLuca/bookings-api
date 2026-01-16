import { BaseError } from "../../../shared/errors/base-error.js";

export class AuthUserInactiveError extends BaseError {
  readonly statusCode = 403;
  readonly code = "AUTH_USER_INACTIVE";

  constructor() {
    super("Sua conta está inativa. Entre em contato com o suporte.");
  }
}
