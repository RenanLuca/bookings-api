export { BaseError } from "./base-error.js";
export { ForbiddenError, ValidationError, InternalError } from "./common.errors.js";
export {
  AuthInvalidCredentialsError,
  AuthTokenInvalidError,
  AuthUserInactiveError
} from "../../modules/auth/auth.errors.js";
export {
  AppointmentConflictError,
  AppointmentInvalidStatusError,
  AppointmentNotFoundError
} from "../../modules/appointments/appointments.errors.js";
export {
  CustomerNotFoundError,
  UserNotFoundError,
  UserEmailAlreadyExistsError
} from "../../modules/customers/customers.errors.js";
export { ModuleAccessForbiddenError } from "../../modules/permissions/permissions.errors.js";
export { RoomNotFoundError } from "../../modules/rooms/rooms.errors.js";
