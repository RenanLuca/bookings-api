import bcrypt from "bcryptjs";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../../config/env.js";
import { InternalError } from "../../shared/errors/index.js";
import {
  AuthInvalidCredentialsError,
  AuthTokenInvalidError,
  AuthUserInactiveError
} from "./errors/index.js";
import { activityTypes, logMessages } from "../../shared/constants/log-messages.js";
import { authMessages } from "./constants/index.js";
import type { ILogsService } from "../logs/logs.service.interface.js";
import type { IAuthRepository } from "./auth.repository.interface.js";
import type { CheckEmailResult, LoginResult } from "./dto/index.js";

class AuthService  {
  constructor(
    private readonly repository: IAuthRepository,
    private readonly activityLogs: ILogsService
  ) {}

  private async logActivity(userId: number, activityType: string, description: string) {
    await this.activityLogs.createLog({
      userId,
      module: "ACCOUNT",
      activityType,
      description
    });
  }

  async checkEmail(email: string): Promise<CheckEmailResult> {
    const user = await this.repository.findUserByEmail(email);
    const exists = Boolean(user);
    const canLogin = Boolean(user && user.status === "ACTIVE");

    let message = "";
    if (!exists) {
      message = authMessages.checkEmail.notFound;
    } else if (!canLogin) {
      message = authMessages.checkEmail.inactive;
    } else {
      message = authMessages.checkEmail.found;
    }

    return { exists, canLogin, message };
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.repository.findUserByEmail(email);
    if (!user) {
      throw new AuthInvalidCredentialsError();
    }
    if (user.status !== "ACTIVE") {
      throw new AuthUserInactiveError();
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new AuthInvalidCredentialsError();
    }
    const payload = { userId: user.id, role: user.role, email: user.email };
    const expiresIn = env.jwtExpiresIn as StringValue;
    const signOptions: SignOptions = { expiresIn };
    const token = jwt.sign(payload, env.jwtSecret, signOptions);
    const verified = jwt.verify(token, env.jwtSecret);
    if (typeof verified !== "object" || !verified) {
      throw new InternalError();
    }
    const exp = (verified as JwtPayload).exp;
    if (!exp) {
      throw new InternalError();
    }
    const expiresAt = new Date(exp * 1000);
    await this.repository.createAuthToken(user.id, token, expiresAt);
    await this.logActivity(user.id, activityTypes.LOGIN, logMessages.USER_LOGIN);
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: authMessages.login.success
    };
  }

  async logout(userId: number, token: string): Promise<{ message: string }> {
    const revoked = await this.repository.revokeAuthToken(userId, token);
    if (!revoked) {
      throw new AuthTokenInvalidError();
    }
    await this.logActivity(userId, activityTypes.LOGOUT, logMessages.USER_LOGOUT);
    return { message: authMessages.logout.success };
  }
}

export { AuthService };
