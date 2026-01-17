import type { NextFunction, Request, Response } from "express";
import { AuthTokenInvalidError } from "./errors/index.js";
import { AuthFactory } from "./auth.factory.js";
import { ResponseHelper } from "../../shared/utils/response.helper.js";
import { authMessages } from "./constants/index.js";

const service = AuthFactory.createService();

class AuthController {
  async checkEmail(req: Request, res: Response, next: NextFunction) {
    const email = req.body.email as string;
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
    const email = req.body.email as string;
    const password = req.body.password as string;
    try {
      const result = await service.login(email, password);
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
    const user = req.user;
    if (!user || !user.token) {
      return next(new AuthTokenInvalidError());
    }
    try {
      await service.logout(user.userId, user.token);
      return res.status(200).json(
        ResponseHelper.successMessage(authMessages.logout.success)
      );
    } catch (error) {
      return next(error);
    }
  }
}

export { AuthController };
