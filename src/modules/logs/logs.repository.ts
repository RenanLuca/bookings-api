import type { FindAndCountOptions, OrderItem, WhereOptions } from "sequelize";
import { ActivityLog } from "../../models/index.js";
import type { CreateLogInput } from "./dto/index.js";
import type { ILogsRepository, ListByUserIdParams, FindAllWithFiltersParams } from "./logs.repository.interface.js";

class LogsRepository implements ILogsRepository {
  async create(data: CreateLogInput) {
    return ActivityLog.create(data);
  }

  async listByUserId(params: ListByUserIdParams) {
    const offset = (params.page - 1) * params.pageSize;
    const direction = params.sort === "asc" ? "ASC" : "DESC";
    const order: OrderItem[] = [["createdAt", direction], ["id", direction]];
    const options: FindAndCountOptions = {
      where: { userId: params.userId },
      limit: params.pageSize,
      offset,
      order
    };
    return ActivityLog.findAndCountAll(options);
  }

  async findAllWithFilters(params: FindAllWithFiltersParams) {
    const direction = params.order === "asc" ? "ASC" : "DESC";
    const order: OrderItem[] = [["createdAt", direction], ["id", direction]];
    const where: WhereOptions = {};

    if (params.module) {
      where.module = params.module;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    const options: FindAndCountOptions = {
      where,
      limit: params.limit,
      offset: params.offset,
      order
    };

    return ActivityLog.findAndCountAll(options);
  }
}

export { LogsRepository };
