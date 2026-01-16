import type { AuthToken } from "../../models/auth-token.model.js";
import type { User } from "../../models/user.model.js";

interface IAuthRepository {
  findUserByEmail(email: string): Promise<User | null>;
  createAuthToken(userId: number, token: string, expiresAt: Date): Promise<AuthToken>;
  findActiveToken(token: string, userId: number): Promise<AuthToken | null>;
  revokeAuthToken(userId: number, token: string): Promise<number>;
}

export type { IAuthRepository };
