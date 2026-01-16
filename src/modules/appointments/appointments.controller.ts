import type { NextFunction, Request, Response } from "express";
import { AuthTokenInvalidError } from "../auth/auth.errors.js";
import { AppointmentsFactory } from "./appointments.factory.js";
import type { CreateAppointmentInput } from "./appointments.dto.js";

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
      const appointment = await service.createAppointment(
        authUser.userId,
        payload
      );
      return res.status(201).json(appointment);
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
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    try {
      const filters = {
        page,
        pageSize,
        sort,
        ...(from !== undefined ? { from } : {}),
        ...(to !== undefined ? { to } : {})
      };
      const appointments = await service.listMyAppointments(
        authUser.userId,
        filters
      );
      return res.json(appointments);
    } catch (error) {
      return next(error);
    }
  }

  async listAll(req: Request, res: Response, next: NextFunction) {
    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
    const sortParam = typeof req.query.sort === "string" ? req.query.sort : "";
    const sort: "asc" | "desc" = sortParam === "asc" ? "asc" : "desc";
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    try {
      const filters = {
        page,
        pageSize,
        sort,
        ...(from !== undefined ? { from } : {}),
        ...(to !== undefined ? { to } : {})
      };
      const appointments = await service.listAll(filters);
      return res.json(appointments);
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
      const appointment = await service.acceptAppointment(id, authUser.userId);
      return res.json(appointment);
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
      const appointment = await service.cancelAppointment(id, authUser.userId, authUser.role);
      return res.json(appointment);
    } catch (error) {
      return next(error);
    }
  }
}

export { AppointmentsController };
