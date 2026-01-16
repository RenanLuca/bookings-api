import { AuthToken, User } from "../../models/index.js";
import type { IAuthRepository } from "./auth.repository.interface.js";

class AuthRepository implements IAuthRepository {
  async findUserByEmail(email: string) {
    return User.findOne({ where: { email } });
  }

  async createAuthToken(userId: number, token: string, expiresAt: Date) {
    return AuthToken.create({ userId, token, expiresAt });
  }

  async findActiveToken(token: string, userId: number) {
    return AuthToken.findOne({ where: { token, userId, revokedAt: null } });
  }

  async revokeAuthToken(userId: number, token: string) {
    const [updated] = await AuthToken.update(
      { revokedAt: new Date() },
      { where: { userId, token, revokedAt: null } }
    );
    return updated;
  }
}

export { AuthRepository };
