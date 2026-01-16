import type { NextFunction, Request, Response } from "express";
import type { PermissionModule } from "../permissions/modules.js";
import { AuthTokenInvalidError } from "../../modules/auth/errors/index.js";
import { CustomerNotFoundError } from "../../modules/customers/errors/index.js";
import { ModuleAccessForbiddenError } from "../../modules/permissions/errors/index.js";
import { RepositoryFactory } from "../factories/repository.factory.js";

const customersRepository = RepositoryFactory.getCustomersRepository();
const permissionsRepository = RepositoryFactory.getPermissionsRepository();

const requirePermission =
  (module: PermissionModule) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthTokenInvalidError());
    }

    const customer = await customersRepository.findCustomerByUserId(req.user.userId);
    if (!customer) {
      return next(new CustomerNotFoundError());
    }

    const permission = await permissionsRepository.findByCustomerAndModule(customer.id, module);
    if (permission && !permission.canView) {
      return next(new ModuleAccessForbiddenError());
    }

    return next();
  };

export { requirePermission };
