import type { NextFunction, Request, Response } from "express";
import { matchedData } from "express-validator";
import { AppointmentsFactory } from "./appointments.factory.js";
import { ResponseHelper } from "../../shared/http/response.helper.js";
import { appointmentsMessages } from "./constants/index.js";
import type { CreateAppointmentInput, ListFiltersInput } from "./dto/index.js";
import { getAuthUser } from "../../shared/http/auth.helper.js";
import type { IdParam } from "../../shared/http/route-params.dto.js";

const service = AppointmentsFactory.createService();

class AppointmentsController {
  async create(req: Request, res: Response, next: NextFunction) {
    const { userId } = getAuthUser(req);
    const data = matchedData(req, { locations: ["body"] }) as CreateAppointmentInput;
    try {
      const result = await service.createAppointment(
        userId,
        data
      );
      return res.status(201).json(
        ResponseHelper.success(result.appointment, appointmentsMessages.create.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async listMine(req: Request, res: Response, next: NextFunction) {
    const { userId } = getAuthUser(req);
    const filters = matchedData(req, { locations: ["query"] }) as ListFiltersInput;
    try {
      const result = await service.listMyAppointments(
        userId,
        filters
      );
      return res.status(200).json(
        ResponseHelper.buildPaginatedResponse(
          result.data,
          result.meta,
          appointmentsMessages.list.success
        )
      );
    } catch (error) {
      return next(error);
    }
  }

  async listAll(req: Request, res: Response, next: NextFunction) {
    const filters = matchedData(req, { locations: ["query"] }) as ListFiltersInput;
    try {
      const result = await service.listAll(filters);
      return res.status(200).json(
        ResponseHelper.buildPaginatedResponse(
          result.data,
          result.meta,
          appointmentsMessages.list.success
        )
      );
    } catch (error) {
      return next(error);
    }
  }

  async accept(req: Request, res: Response, next: NextFunction) {
    const { userId } = getAuthUser(req);
    const { id } = matchedData(req, { locations: ["params"] }) as IdParam;
    try {
      const result = await service.acceptAppointment(id, userId)
      return res.status(200).json(
        ResponseHelper.success(result.appointment, appointmentsMessages.accept.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    const authUser = getAuthUser(req);
    const { id } = matchedData(req, { locations: ["params"] }) as IdParam;
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
