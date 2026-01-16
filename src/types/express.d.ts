import type { UserRole } from "../models/user.model.js";

declare global {
  namespace Express {
    export interface AuthUser {
      userId: number;
      role: UserRole;
      email: string;
      token: string;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
