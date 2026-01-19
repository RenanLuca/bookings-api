import type { NextFunction, Request, Response } from "express";
import { matchedData } from "express-validator";
import { AuthTokenInvalidError } from "../auth/errors/index.js";
import { AppointmentsFactory } from "./appointments.factory.js";
import { ResponseHelper } from "../../shared/utils/response.helper.js";
import { appointmentsMessages } from "./constants/index.js";
import type { CreateAppointmentInput } from "./dto/index.js";

const service = AppointmentsFactory.createService();

class AppointmentsController {
  async create(req: Request, res: Response, next: NextFunction) {
    const authUser = req.user;
    if (!authUser) {
      return next(new AuthTokenInvalidError());
    }
    const payload: CreateAppointmentInput = {
      roomId: req.body.roomId,
      scheduledAt: req.body.scheduledAt
    };
    try {
      const result = await service.createAppointment(
        authUser.userId,
        payload
      );
      return res.status(201).json(
        ResponseHelper.success(result.appointment, appointmentsMessages.create.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async listMine(req: Request, res: Response, next: NextFunction) {
    const authUser = req.user;
    if (!authUser) {
      return next(new AuthTokenInvalidError());
    }
    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
    const sortParam = typeof req.query.sort === "string" ? req.query.sort : "";
    const sort: "asc" | "desc" = sortParam === "asc" ? "asc" : "desc";
    const queryData = matchedData(req, { locations: ["query"] }) as {
      from?: string;
      to?: string;
      search?: string;
    };
    try {
      const filters = {
        page,
        pageSize,
        sort,
        ...(queryData.from ? { from: queryData.from } : {}),
        ...(queryData.to ? { to: queryData.to } : {}),
        ...(queryData.search ? { search: queryData.search } : {})
      };
      const result = await service.listMyAppointments(
        authUser.userId,
        filters
      );
      return res.status(200).json(
        ResponseHelper.successWithPagination(
          result.data,
          {
            page: result.meta.page,
            limit: result.meta.pageSize,
            total: result.meta.total,
            totalPages: Math.ceil(result.meta.total / result.meta.pageSize)
          },
          appointmentsMessages.list.success
        )
      );
    } catch (error) {
      return next(error);
    }
  }

  async listAll(req: Request, res: Response, next: NextFunction) {
    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
    const sortParam = typeof req.query.sort === "string" ? req.query.sort : "";
    const sort: "asc" | "desc" = sortParam === "asc" ? "asc" : "desc";
    const queryData = matchedData(req, { locations: ["query"] }) as {
      from?: string;
      to?: string;
      search?: string;
    };
    try {
      const filters = {
        page,
        pageSize,
        sort,
        ...(queryData.from ? { from: queryData.from } : {}),
        ...(queryData.to ? { to: queryData.to } : {}),
        ...(queryData.search ? { search: queryData.search } : {})
      };
      const result = await service.listAll(filters);
      return res.status(200).json(
        ResponseHelper.successWithPagination(
          result.data,
          {
            page: result.meta.page,
            limit: result.meta.pageSize,
            total: result.meta.total,
            totalPages: Math.ceil(result.meta.total / result.meta.pageSize)
          },
          appointmentsMessages.list.success
        )
      );
    } catch (error) {
      return next(error);
    }
  }

  async accept(req: Request, res: Response, next: NextFunction) {
    const authUser = req.user;
    if (!authUser) {
      return next(new AuthTokenInvalidError());
    }
    const id = Number(req.params.id);
    try {
      const result = await service.acceptAppointment(id, authUser.userId);
      return res.status(200).json(
        ResponseHelper.success(result.appointment, appointmentsMessages.accept.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    const authUser = req.user;
    if (!authUser) {
      return next(new AuthTokenInvalidError());
    }
    const id = Number(req.params.id);
    try {
      const result = await service.cancelAppointment(id, authUser.userId, authUser.role);
      return res.status(200).json(
        ResponseHelper.success(result.appointment, appointmentsMessages.cancel.success)
      );
    } catch (error) {
      return next(error);
    }
  }
}

export { AppointmentsController };
