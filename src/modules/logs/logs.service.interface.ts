import type { ActivityLog } from "../../models/activity-log.model.js";
import type { CreateLogInput, ListLogsInput, ListLogsResult, ListAllLogsInput } from "./dto/index.js";

interface ILogsService {
  createLog(data: CreateLogInput): Promise<ActivityLog>;
  listByUserId(userId: number, params: ListLogsInput): Promise<ListLogsResult>;
  listAllLogs(params: ListAllLogsInput): Promise<ListLogsResult>;
}

export type { ILogsService };
