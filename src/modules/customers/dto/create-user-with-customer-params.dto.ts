import type { UserRole, UserStatus } from "../../../models/user.model.js";
import type { CustomerData } from "./customer-data.dto.js";

export type CreateUserWithCustomerParams = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  customer: CustomerData;
};
