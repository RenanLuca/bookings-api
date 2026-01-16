import { BaseError } from "../../../shared/errors/base-error.js";

export class AppointmentNotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly code = "APPOINTMENT_NOT_FOUND";

  constructor() {
    super("Agendamento não encontrado.");
  }
}
