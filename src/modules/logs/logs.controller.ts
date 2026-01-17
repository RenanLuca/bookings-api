import type { NextFunction, Request, Response } from "express";
import { AuthTokenInvalidError } from "../auth/errors/index.js";
import { LogsFactory } from "./logs.factory.js";
import { ResponseHelper } from "../../shared/utils/response.helper.js";
import { logsMessages } from "./constants/index.js";
import type { ListLogsInput, ListAllLogsInput } from "./dto/index.js";
import type { ActivityLogModule } from "../../models/activity-log.model.js";

const service = LogsFactory.createService();

class LogsController {
  async listMine(req: Request, res: Response, next: NextFunction) {
    const authUser = req.user;
    if (!authUser) {
      return next(new AuthTokenInvalidError());
    }

    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
    const sortParam = typeof req.query.sort === "string" ? req.query.sort : "";
    const sort = sortParam === "asc" ? "asc" : "desc";

    const params: ListLogsInput = { page, pageSize, sort };

    try {
      const result = await service.listByUserId(authUser.userId, params);
      return res.status(200).json(
        ResponseHelper.successWithPagination(
          result.data,
          {
            page: result.meta.page,
            limit: result.meta.pageSize,
            total: result.meta.total,
            totalPages: Math.ceil(result.meta.total / result.meta.pageSize)
          },
          logsMessages.list.success
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
    const sort = sortParam === "asc" ? "asc" : "desc";
    const module = typeof req.query.module === "string" ? req.query.module as ActivityLogModule : undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;

    const params: ListAllLogsInput = { page, pageSize, sort, module, userId };

    try {
      const result = await service.listAllLogs(params);
      return res.status(200).json(
        ResponseHelper.successWithPagination(
          result.data,
          {
            page: result.meta.page,
            limit: result.meta.pageSize,
            total: result.meta.total,
            totalPages: Math.ceil(result.meta.total / result.meta.pageSize)
          },
          logsMessages.list.success
        )
      );
    } catch (error) {
      return next(error);
    }
  }
}

export { LogsController };
