import type { UserRole } from "../../../models/user.model.js";

export type LoginResult = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
  message: string;
};
