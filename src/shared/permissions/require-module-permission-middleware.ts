import type { NextFunction, Request, Response } from "express";
import type { PermissionModule } from "./modules.js";

import { AuthTokenInvalidError } from "../../modules/auth/errors/index.js";
import { CustomerNotFoundError } from "../../modules/customers/errors/index.js";
import { ModuleAccessForbiddenError } from "../../modules/permissions/errors/index.js";

import { RepositoryFactory } from "../factories/repository.factory.js";

const customersRepository = RepositoryFactory.getCustomersRepository();
const permissionsRepository = RepositoryFactory.getPermissionsRepository();

const requireModulePermission =
  (module: PermissionModule) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AuthTokenInvalidError());
      }

      const customer = await customersRepository.findCustomerByUserId(
        req.user.userId
      );

      if (!customer) {
        return next(new CustomerNotFoundError());
      }

      const permission =
        await permissionsRepository.findByCustomerAndModule(
          customer.id,
          module
        );

      // default deny
      if (!permission || !permission.canView) {
        return next(new ModuleAccessForbiddenError());
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };

export { requireModulePermission };
