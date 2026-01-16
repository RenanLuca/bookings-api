import type { NextFunction, Request, Response } from "express";
import { AuthTokenInvalidError } from "./auth.errors.js";
import { AuthFactory } from "./auth.factory.js";

const service = AuthFactory.createService();

class AuthController {
  async checkEmail(req: Request, res: Response, next: NextFunction) {
    const email = req.body.email as string;
    try {
      const result = await service.checkEmail(email);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    const email = req.body.email as string;
    const password = req.body.password as string;
    try {
      const result = await service.login(email, password);
      return res.json(result);
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
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

export { AuthController };
