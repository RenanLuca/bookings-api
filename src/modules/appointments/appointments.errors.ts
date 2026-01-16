import { BaseError } from "../../shared/errors/base-error.js";

export class AppointmentConflictError extends BaseError {
  readonly statusCode = 409;
  readonly code = "APPOINTMENT_CONFLICT";

  constructor() {
    super("Já existe um agendamento para esta sala neste horário.");
  }
}

export class AppointmentInvalidStatusError extends BaseError {
  readonly statusCode = 400;
  readonly code = "APPOINTMENT_INVALID_STATUS";

  constructor() {
    super("Status do agendamento não permite esta ação.");
  }
}

export class AppointmentNotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly code = "APPOINTMENT_NOT_FOUND";

  constructor() {
    super("Agendamento não encontrado.");
  }
}

export class AppointmentForbiddenError extends BaseError {
  readonly statusCode = 403;
  readonly code = "APPOINTMENT_FORBIDDEN";

  constructor() {
    super("Você não tem permissão para acessar este agendamento.");
  }
}