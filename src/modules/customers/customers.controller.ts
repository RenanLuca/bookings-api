import type { NextFunction, Request, Response } from "express";
import { matchedData } from "express-validator";
import { AuthTokenInvalidError } from "../auth/errors/index.js";
import { CustomersFactory } from "./customers.factory.js";
import { PermissionsFactory } from "../permissions/permissions.factory.js";
import { customersMessages } from "./constants/index.js";
import { ResponseHelper } from "../../shared/http/response.helper.js";
import {
  toUtcEndOfDayFromAppTz,
  toUtcStartOfDayFromAppTz
} from "../../shared/utils/datetime.js";
import type { UserStatus } from "../../models/user.model.js";
import type { RegisterInput, UpdateProfileInput, CustomerData } from "./dto/index.js";
import type { ModulePermissionUpdate } from "../permissions/permissions.service.interface.js";

const service = CustomersFactory.createService();
const permissionsService = PermissionsFactory.createService();

class CustomersController {
  async register(req: Request, res: Response, next: NextFunction) {
    const { name, email, password, customer } = req.body;
    try {
      const input: RegisterInput = {
        name,
        email,
        password
      };
      if (customer && typeof customer === "object") {
        input.customer = customer;
      }
      const result = await service.register(input);
      return res.status(201).json(
        ResponseHelper.success(result.profile, customersMessages.register.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
    const sortParam = typeof req.query.sort === "string" ? req.query.sort : "";
    const sort = sortParam === "asc" ? "asc" : "desc";
    const queryData = matchedData(req, { locations: ["query"] }) as {
      name?: string;
      from?: string;
      to?: string;
    };
    try {
      const params: {
        page: number;
        pageSize: number;
        sort: "asc" | "desc";
        name?: string;
        from?: Date;
        to?: Date;
      } = { page, pageSize, sort };
      if (queryData.name) {
        params.name = queryData.name;
      }
      if (queryData.from) {
        params.from = toUtcStartOfDayFromAppTz(queryData.from);
      }
      if (queryData.to) {
        params.to = toUtcEndOfDayFromAppTz(queryData.to);
      }
      const result = await service.listCustomers(params);
      return res.status(200).json(
        ResponseHelper.successWithPagination(
          result.data,
          {
            page: result.meta.page,
            limit: result.meta.pageSize,
            total: result.meta.total,
            totalPages: Math.ceil(result.meta.total / result.meta.pageSize)
          },
          customersMessages.list.success
        )
      );
    } catch (error) {
      return next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    try {
      const profile = await service.getCustomerById(id);
      return res.status(200).json(
        ResponseHelper.success(profile, customersMessages.get.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    try {
      await service.softDeleteCustomer(id);
      return res.status(200).json(
        ResponseHelper.successMessage(customersMessages.delete.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    const authUser = req.user;
    if (!authUser) {
      return next(new AuthTokenInvalidError());
    }
    try {
      const profile = await service.getProfile(authUser.userId);
      return res.status(200).json(
        ResponseHelper.success(profile, customersMessages.get.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    const authUser = req.user;
    if (!authUser) {
      return next(new AuthTokenInvalidError());
    }
    const data = matchedData(req, { locations: ["body"] }) as UpdateProfileInput;

    try {
      const payload: UpdateProfileInput = {};
      if (data.user && Object.keys(data.user).length) {
        payload.user = data.user;
      }
      const rawCustomer = req.body?.customer ?? {};
      const customerPayload: Partial<CustomerData> = { ...(data.customer ?? {}) };
      if (
        Object.prototype.hasOwnProperty.call(rawCustomer, "complement") &&
        rawCustomer.complement === null
      ) {
        customerPayload.complement = null;
      }
      if (Object.keys(customerPayload).length) {
        payload.customer = customerPayload;
      }
      const result = await service.updateProfile(authUser.userId, payload);
      return res.status(200).json(
        ResponseHelper.success(result.profile, customersMessages.update.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async updatePermissions(req: Request, res: Response, next: NextFunction) {
    const authUser = req.user;
    if (!authUser) {
      return next(new AuthTokenInvalidError());
    }
    const customerId = Number(req.params.id);
    const modules: ModulePermissionUpdate[] = req.body.modules;
    try {
      const permissions = await permissionsService.updatePermissions(
        customerId,
        modules,
        authUser.userId
      );
      return res.status(200).json(
        ResponseHelper.success({ permissions }, customersMessages.permissions.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async updateCustomerStatus(req: Request, res: Response, next: NextFunction) {
    const authUser = req.user;
    if (!authUser) {
      return next(new AuthTokenInvalidError());
    }
    const customerId = Number(req.params.id);
    const status: UserStatus = req.body.status;
    try {
      const result = await service.updateCustomerStatus(customerId, status);
      return res.status(200).json(
        ResponseHelper.success(result.profile, customersMessages.status.success)
      );
    } catch (error) {
      return next(error);
    }
  }
}

export { CustomersController };
