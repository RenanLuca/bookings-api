import type { NextFunction, Request, Response } from "express";
import { matchedData } from "express-validator";
import { RoomsFactory } from "./rooms.factory.js";
import { ResponseHelper } from "../../shared/http/response.helper.js";
import { roomsMessages } from "./constants/index.js";
import type { CreateRoomInput, UpdateRoomInput, FindPaginatedParams } from "./dto/index.js";
import { getAuthUser } from "../../shared/http/auth.helper.js";
import type { IdParam } from "../../shared/http/route-params.dto.js";

const service = RoomsFactory.createService();

class RoomsController {
  async list(req: Request, res: Response, next: NextFunction) {
    const params = matchedData(req, { locations: ["query"] }) as FindPaginatedParams;
    try {
      const result = await service.listRooms(params);
      return res.status(200).json(
        ResponseHelper.buildPaginatedResponse(
          result.data,
          result.meta,
          roomsMessages.list.success
        )
      );
    } catch (error) {
      return next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    const { id } = matchedData(req, { locations: ["params"] }) as IdParam;
    try {
      const room = await service.getRoomById(id);
      return res.status(200).json(
        ResponseHelper.success(room, roomsMessages.get.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    const { userId } = getAuthUser(req);
    const data = matchedData(req, { locations: ["body"] }) as CreateRoomInput;
    try {
      const result = await service.createRoom(data, userId);
      return res.status(201).json(
        ResponseHelper.success(result.room, roomsMessages.create.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    const { userId } = getAuthUser(req);
    const { id } = matchedData(req, { locations: ["params"] }) as IdParam;
    const data = matchedData(req, { locations: ["body"] }) as UpdateRoomInput;
    try {
      const result = await service.updateRoom(id, data, userId);
      return res.status(200).json(
        ResponseHelper.success(result.room, roomsMessages.update.success)
      );
    } catch (error) {
      return next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    const { userId } = getAuthUser(req);
    const { id } = matchedData(req, { locations: ["params"] }) as IdParam;
    try {
      await service.deleteRoom(id, userId);
      return res.status(200).json(
        ResponseHelper.successMessage(roomsMessages.delete.success)
      );
    } catch (error) {
      return next(error);
    }
  }
}

export { RoomsController };
