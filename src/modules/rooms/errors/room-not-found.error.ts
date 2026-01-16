import { BaseError } from "../../../shared/errors/base-error.js";

export class RoomNotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly code = "ROOM_NOT_FOUND";

  constructor() {
    super("Sala não encontrada.");
  }
}
