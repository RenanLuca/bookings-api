import type { NextFunction, Request, Response } from "express";
import { AuthTokenInvalidError } from "../auth/errors/index.js";
import { RoomsFactory } from "./rooms.factory.js";
import type { CreateRoomInput, UpdateRoomInput } from "./dto/index.js";

const service = RoomsFactory.createService();

class RoomsController {
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
      const result = await service.listRooms(params);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    try {
      const room = await service.getRoomById(id);
      return res.json(room);
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    const authUser = req.user;
    if (!authUser) {
      return next(new AuthTokenInvalidError());
    }
    const payload: CreateRoomInput = {
      name: req.body.name,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      slotDurationMinutes: req.body.slotDurationMinutes
    };
    try {
      const room = await service.createRoom(payload, authUser.userId);
      return res.status(201).json(room);
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    const authUser = req.user;
    if (!authUser) {
      return next(new AuthTokenInvalidError());
    }
    const id = Number(req.params.id);
    const payload: UpdateRoomInput = {
      name: req.body?.name,
      startTime: req.body?.startTime,
      endTime: req.body?.endTime,
      slotDurationMinutes: req.body?.slotDurationMinutes
    };
    try {
      const room = await service.updateRoom(id, payload, authUser.userId);
      return res.json(room);
    } catch (error) {
      return next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    const authUser = req.user;
    if (!authUser) {
      return next(new AuthTokenInvalidError());
    }
    const id = Number(req.params.id);
    try {
      await service.deleteRoom(id, authUser.userId);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

export { RoomsController };
