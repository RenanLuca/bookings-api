import type { ProfileUser } from "./profile-user.dto.js";
import type { ProfileCustomer } from "./profile-customer.dto.js";
import type { PermissionResult } from "../../permissions/permissions.service.interface.js";

export type ProfileResult = {
  user: ProfileUser;
  customer: ProfileCustomer;
  permissions?: PermissionResult[];
};
