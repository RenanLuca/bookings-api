import type { ProfileUser } from "./profile-user.dto.js";
import type { ProfileCustomer } from "./profile-customer.dto.js";

export type ProfileResult = {
  user: ProfileUser;
  customer: ProfileCustomer;
};
