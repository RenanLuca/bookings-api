import type { CreateLogInput, ListLogsInput, ListLogsResult, LogResponse, ListAllLogsInput, ActivityLogWithUser } from "./dto/index.js";
import type { ILogsRepository } from "./logs.repository.interface.js";
import { ResponseHelper } from "../../shared/http/response.helper.js";
import {
  toUtcEndOfDayFromAppTz,
  toUtcStartOfDayFromAppTz
} from "../../shared/utils/datetime.js";


class LogsService {
  constructor(private readonly repository: ILogsRepository) { }

  private mapLog(log: ActivityLogWithUser): LogResponse {
    return {
      id: log.id,
      module: log.module,
      activityType: log.activityType,
      description: log.description,
      createdAt: log.createdAt.toISOString(),
      ...(log.User
        ? {
          user: {
            id: log.User.id,
            name: log.User.name,
            role: log.User.role
          }
        }
        : {})
    };
  }

  async createLog(data: CreateLogInput) {
    return this.repository.create(data);
  }

  async listByUserId(userId: number, params: ListLogsInput): Promise<ListLogsResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sort = params.sort ?? "desc";
    const from = params.from ? toUtcStartOfDayFromAppTz(params.from) : undefined;
    const to = params.to ? toUtcEndOfDayFromAppTz(params.to) : undefined;

    const { rows, count } = await this.repository.listByUserId({
      userId,
      page,
      pageSize,
      sort,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(params.search ? { search: params.search } : {})
    });

    return {
      data: rows.map((log) => this.mapLog(log)),
      meta: ResponseHelper.buildMeta(page, pageSize, count, sort)
    };
  }

  async listAllLogs(params: ListAllLogsInput): Promise<ListLogsResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sort = params.sort ?? "desc";
    const from = params.from ? toUtcStartOfDayFromAppTz(params.from) : undefined;
    const to = params.to ? toUtcEndOfDayFromAppTz(params.to) : undefined;

    const { rows, count } = await this.repository.findAllWithFilters({
      page,
      pageSize,
      sort,
      ...(params.module ? { module: params.module } : {}),
      ...(params.userId ? { userId: params.userId } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(params.search ? { search: params.search } : {})
    });


    return {
      data: rows.map((log) => this.mapLog(log)),
      meta: ResponseHelper.buildMeta(page, pageSize, count, sort)
    };
  }
}

export { LogsService };
