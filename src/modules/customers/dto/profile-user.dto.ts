import type { UserRole, UserStatus } from "../../../models/user.model.js";

export type ProfileUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};
