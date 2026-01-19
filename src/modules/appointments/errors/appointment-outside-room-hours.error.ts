import { BaseError } from "../../../shared/errors/base-error.js";

export class AppointmentOutsideRoomHoursError extends BaseError {
  readonly statusCode = 400;
  readonly code = "APPOINTMENT_OUTSIDE_ROOM_HOURS";

  constructor() {
    super("Horário do agendamento está fora do período permitido da sala.");
  }
}

