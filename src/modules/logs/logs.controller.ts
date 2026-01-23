import type { NextFunction, Request, Response } from "express";
import { matchedData } from "express-validator";
import { LogsFactory } from "./logs.factory.js";
import { ResponseHelper } from "../../shared/http/response.helper.js";
import { logsMessages } from "./constants/index.js";
import type { ListLogsInput, ListAllLogsInput } from "./dto/index.js";
import { getAuthUser } from "../../shared/http/auth.helper.js";

const service = LogsFactory.createService();

class LogsController {
  async listMine(req: Request, res: Response, next: NextFunction) {
    const { userId } = getAuthUser(req);
    const params = matchedData(req, { locations: ["query"] }) as ListLogsInput;
    try {
      const result = await service.listByUserId(userId, params);
      return res.status(200).json(
        ResponseHelper.buildPaginatedResponse(
          result.data,
          result.meta,
          logsMessages.list.success
        )
      );
    } catch (error) {
      return next(error);
    }
  }

  async listAll(req: Request, res: Response, next: NextFunction) {
    const params = matchedData(req, { locations: ["query"] }) as ListAllLogsInput;
    try {
      const result = await service.listAllLogs(params);
      return res.status(200).json(
        ResponseHelper.buildPaginatedResponse(
          result.data,
          result.meta,
          logsMessages.list.success
        )
      );
    } catch (error) {
      return next(error);
    }
  }
}

export { LogsController };
