import type { NextFunction, Request, Response } from "express";
import { matchedData } from "express-validator";
import { AuthFactory } from "./auth.factory.js";
import { ResponseHelper } from "../../shared/http/response.helper.js";
import { authMessages } from "./constants/index.js";
import type { CheckEmailInput, LoginInput } from "./dto/index.js";
import { getAuthUser } from "../../shared/http/auth.helper.js";

const service = AuthFactory.createService();

class AuthController {
  async checkEmail(req: Request, res: Response, next: NextFunction) {
    const { email } = matchedData(req, { locations: ["body"] }) as CheckEmailInput;
    try {
      const result = await service.checkEmail(email);
      return res.status(200).json(
        ResponseHelper.success(
          { exists: result.exists, canLogin: result.canLogin },
          result.message
        )
      );
    } catch (error) {
      return next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    const data = matchedData(req, { locations: ["body"] }) as LoginInput;
    try {
      const result = await service.login(data.email, data.password, data.isAdmin);
      return res.status(200).json(
        ResponseHelper.success(
          { token: result.token, user: result.user },
          authMessages.login.success
        )
      );
    } catch (error) {
      return next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    const { userId, token } = getAuthUser(req);
    try {
      await service.logout(userId, token);
      return res.status(200).json(
        ResponseHelper.successMessage(authMessages.logout.success)
      );
    } catch (error) {
      return next(error);
    }
  }
}

export { AuthController };
