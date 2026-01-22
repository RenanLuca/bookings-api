import type { ActivityLog, ActivityLogModule } from "../../models/activity-log.model.js";
import type { CreateLogInput, FindAllWithFiltersParams, ListByUserIdParams } from "./dto/index.js";


interface ILogsRepository {
  create(data: CreateLogInput): Promise<ActivityLog>;
  listByUserId(params: ListByUserIdParams): Promise<{ rows: ActivityLog[]; count: number }>;
  findAllWithFilters(params: FindAllWithFiltersParams): Promise<{ rows: ActivityLog[]; count: number }>;
}

export type { ILogsRepository };
