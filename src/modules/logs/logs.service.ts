import type { CreateLogInput, ListLogsInput, ListLogsResult, LogResponse, ListAllLogsInput } from "./logs.dto.js";
import type { ILogsRepository } from "./logs.repository.interface.js";

class LogsService {
  constructor(private readonly repository: ILogsRepository) {}

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

    const data: LogResponse[] = rows.map((log) => ({
      id: log.id,
      module: log.module,
      activityType: log.activityType,
      description: log.description,
      createdAt: log.createdAt.toISOString()
    }));

    return {
      data,
      meta: {
        page: params.page,
        pageSize: params.pageSize,
        total: count,
        sort: params.sort
      }
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

    const data: LogResponse[] = rows.map((log) => ({
      id: log.id,
      module: log.module,
      activityType: log.activityType,
      description: log.description,
      createdAt: log.createdAt.toISOString()
    }));

    return {
      data,
      meta: {
        page: params.page,
        pageSize: params.pageSize,
        total: count,
        sort: params.sort
      }
    };
  }
}

export { LogsService };
