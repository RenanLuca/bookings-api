import { BaseError } from "../../../shared/errors/base-error.js";

export class CustomerNotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly code = "CUSTOMER_NOT_FOUND";

  constructor() {
    super("Cliente não encontrado.");
  }
}
