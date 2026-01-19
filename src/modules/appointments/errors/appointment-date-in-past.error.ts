import { BaseError } from "../../../shared/errors/base-error.js";

export class AppointmentDateInPastError extends BaseError {
  readonly statusCode = 400;
  readonly code = "APPOINTMENT_DATE_IN_PAST";

  constructor() {
    super("Não é permitido criar agendamentos em datas anteriores a hoje.");
  }
}

