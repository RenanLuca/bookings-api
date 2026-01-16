import { BaseError } from "../../../shared/errors/base-error.js";

export class AppointmentInvalidStatusError extends BaseError {
  readonly statusCode = 400;
  readonly code = "APPOINTMENT_INVALID_STATUS";

  constructor() {
    super("Status do agendamento não permite esta ação.");
  }
}
