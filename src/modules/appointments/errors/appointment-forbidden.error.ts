import { BaseError } from "../../../shared/errors/base-error.js";

export class AppointmentForbiddenError extends BaseError {
  readonly statusCode = 403;
  readonly code = "APPOINTMENT_FORBIDDEN";

  constructor() {
    super("Você não tem permissão para acessar este agendamento.");
  }
}
