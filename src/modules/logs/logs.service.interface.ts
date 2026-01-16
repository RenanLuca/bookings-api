import type { ActivityLog } from "../../models/activity-log.model.js";
import type { CreateLogInput, ListLogsInput, ListLogsResult, ListAllLogsInput } from "./logs.dto.js";

interface ILogsService {
  createLog(data: CreateLogInput): Promise<ActivityLog>;
  listByUserId(userId: number, params: ListLogsInput): Promise<ListLogsResult>;
  listAllLogs(params: ListAllLogsInput): Promise<ListLogsResult>;
}

export type { ILogsService };
