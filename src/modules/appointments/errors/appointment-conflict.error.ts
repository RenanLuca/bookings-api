import { BaseError } from "../../../shared/errors/base-error.js";

export class AppointmentConflictError extends BaseError {
  readonly statusCode = 409;
  readonly code = "APPOINTMENT_CONFLICT";

  constructor() {
    super("Já existe um agendamento para esta sala neste horário.");
  }
}
