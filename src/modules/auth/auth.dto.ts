import type { UserRole } from "../../models/user.model.js";

type CheckEmailResult = {
  exists: boolean;
  canLogin: boolean;
};

type LoginResult = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
};

export type { CheckEmailResult, LoginResult };
