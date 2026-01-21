export { BaseError } from "./base-error.js";
export { ForbiddenError } from "./forbiddenError.js";
export { ValidationError } from "./validationError.js";
export { InternalError } from "./internalError.js";
export {
  AuthInvalidCredentialsError,
  AuthTokenInvalidError,
  AuthUserInactiveError
} from "../../modules/auth/errors/index.js";
export {
  AppointmentConflictError,
  AppointmentInvalidStatusError,
  AppointmentNotFoundError
} from "../../modules/appointments/errors/index.js";
export {
  CustomerNotFoundError,
  UserNotFoundError,
  UserEmailAlreadyExistsError
} from "../../modules/customers/errors/index.js";
export { ModuleAccessForbiddenError } from "../../modules/permissions/errors/index.js";
export { RoomNotFoundError } from "../../modules/rooms/errors/index.js";
