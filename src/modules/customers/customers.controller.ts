import type { NextFunction, Request, Response } from "express";
import { AuthTokenInvalidError } from "../auth/errors/index.js";
import { CustomersFactory } from "./customers.factory.js";
import { PermissionsFactory } from "../permissions/permissions.factory.js";
import { customersMessages } from "./constants/index.js";
import { ResponseHelper } from "../../shared/utils/response.helper.js";
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
    const name =
      typeof req.query.name === "string" && req.query.name.trim()
        ? req.query.name.trim()
        : undefined;
    try {
      const params: {
        page: number;
        pageSize: number;
        sort: "asc" | "desc";
        name?: string;
      } = { page, pageSize, sort };
      if (name !== undefined) {
        params.name = name;
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
    const userPayload = req.body?.user ?? {};
    const customerPayload = req.body?.customer ?? {};
    const updateUser: { name?: string; email?: string; password?: string } = {};
    const updateCustomer: Partial<CustomerData> = {};

    if (userPayload.name !== undefined) {
      updateUser.name = userPayload.name;
    }
    if (userPayload.email !== undefined) {
      updateUser.email = userPayload.email;
    }
    if (userPayload.password !== undefined) {
      updateUser.password = userPayload.password;
    }

    if (customerPayload.zipCode !== undefined) {
      updateCustomer.zipCode = customerPayload.zipCode;
    }
    if (customerPayload.street !== undefined) {
      updateCustomer.street = customerPayload.street;
    }
    if (customerPayload.number !== undefined) {
      updateCustomer.number = customerPayload.number;
    }
    if (customerPayload.neighborhood !== undefined) {
      updateCustomer.neighborhood = customerPayload.neighborhood;
    }
    if (customerPayload.city !== undefined) {
      updateCustomer.city = customerPayload.city;
    }
    if (customerPayload.state !== undefined) {
      updateCustomer.state = customerPayload.state;
    }
    if (customerPayload.complement !== undefined) {
      updateCustomer.complement = customerPayload.complement;
    }

    try {
      const payload: UpdateProfileInput = {};
      if (Object.keys(updateUser).length) {
        payload.user = updateUser;
      }
      if (Object.keys(updateCustomer).length) {
        payload.customer = updateCustomer;
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
}

export { CustomersController };
