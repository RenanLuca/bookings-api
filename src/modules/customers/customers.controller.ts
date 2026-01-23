import type { NextFunction, Request, Response } from "express";
import { matchedData } from "express-validator";
import { CustomersFactory } from "./customers.factory.js";
import { PermissionsFactory } from "../permissions/permissions.factory.js";
import { customersMessages } from "./constants/index.js";
import { ResponseHelper } from "../../shared/http/response.helper.js";
import type { UserStatus } from "../../models/user.model.js";
import type { RegisterInput, UpdateProfileInput, ListCustomersInput } from "./dto/index.js";
import type { ModulePermissionUpdate } from "../permissions/permissions.service.interface.js";
import { getAuthUser } from "../../shared/http/auth.helper.js";
import type { IdParam } from "../../shared/http/route-params.dto.js";

const service = CustomersFactory.createService();
const permissionsService = PermissionsFactory.createService();

class CustomersController {
  async register(req: Request, res: Response, next: NextFunction) {
    const data = matchedData(req, { locations: ["body"] }) as RegisterInput;
    try {
      const result = await service.register(data);
      return res.status(201).json(
        ResponseHelper.success(result.profile, customersMessages.register.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    const input = matchedData(req, { locations: ["query"] }) as ListCustomersInput;
    try {
      const result = await service.listCustomers(input);
      return res.status(200).json(
        ResponseHelper.buildPaginatedResponse(
          result.data,
          result.meta,
          customersMessages.list.success
        )
      );
    } catch (error) {
      return next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    const { id } = matchedData(req, { locations: ["params"] }) as IdParam;
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
    const { id } = matchedData(req, { locations: ["params"] }) as IdParam;
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
    const { userId } = getAuthUser(req);
    try {
      const profile = await service.getProfile(userId);
      return res.status(200).json(
        ResponseHelper.success(profile, customersMessages.get.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    const { userId } = getAuthUser(req);
    const data = matchedData(req, { locations: ["body"] }) as UpdateProfileInput;
    const rawCustomer = data.customer;

    try {
      const result = await service.updateProfile(userId, data, rawCustomer);
      return res.status(200).json(
        ResponseHelper.success(result.profile, customersMessages.update.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async updatePermissions(req: Request, res: Response, next: NextFunction) {
    const { userId } = getAuthUser(req);
    const { id: customerId } = matchedData(req, { locations: ["params"] }) as IdParam;
    const { modules } = matchedData(req, { locations: ["body"] }) as { modules: ModulePermissionUpdate[] };
    try {
      const permissions = await permissionsService.updatePermissions(
        customerId,
        modules,
        userId
      );
      return res.status(200).json(
        ResponseHelper.success({ permissions }, customersMessages.permissions.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async updateCustomerStatus(req: Request, res: Response, next: NextFunction) {
    const { id: customerId } = matchedData(req, { locations: ["params"] }) as IdParam;
    const { status } = matchedData(req, { locations: ["body"] }) as { status: UserStatus };
    try {
      const result = await service.updateCustomerStatus(customerId, status);
      return res.status(200).json(
        ResponseHelper.success(result.profile, customersMessages.status.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async getMyPermissions(req: Request, res: Response, next: NextFunction) {
    const { userId } = getAuthUser(req);
    try {
      const result = await service.getMyPermissions(userId);
      return res.status(200).json(
        ResponseHelper.success(result, customersMessages.permissions.get.success)
      );
    } catch (error) {
      return next(error);
    }
  }
}

export { CustomersController };
