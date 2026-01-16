import type { ActivityLog } from "../../models/activity-log.model.js";
import type { CreateLogInput, ListLogsInput, ListLogsResult, LogResponse, ListAllLogsInput, ListLogsMeta } from "./dto/index.js";
import type { ILogsRepository } from "./logs.repository.interface.js";

class LogsService {
  constructor(private readonly repository: ILogsRepository) {}

  private mapLog(log: ActivityLog): LogResponse {
    return {
      id: log.id,
      module: log.module,
      activityType: log.activityType,
      description: log.description,
      createdAt: log.createdAt.toISOString()
    };
  }

  private buildMeta(page: number, pageSize: number, total: number, sort: "asc" | "desc"): ListLogsMeta {
    return { page, pageSize, total, sort };
  }

  async createLog(data: CreateLogInput) {
    return this.repository.create(data);
  }

  async listByUserId(userId: number, params: ListLogsInput): Promise<ListLogsResult> {
    const { rows, count } = await this.repository.listByUserId({
      userId,
      page: params.page,
      pageSize: params.pageSize,
      sort: params.sort
    });

    return {
      data: rows.map((log) => this.mapLog(log)),
      meta: this.buildMeta(params.page, params.pageSize, count, params.sort)
    };
  }

  async listAllLogs(params: ListAllLogsInput): Promise<ListLogsResult> {
    const offset = (params.page - 1) * params.pageSize;

    const { rows, count } = await this.repository.findAllWithFilters({
      module: params.module,
      userId: params.userId,
      limit: params.pageSize,
      offset,
      order: params.sort
    });

    return {
      data: rows.map((log) => this.mapLog(log)),
      meta: this.buildMeta(params.page, params.pageSize, count, params.sort)
    };
  }
}

export { LogsService };
