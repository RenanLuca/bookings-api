import type { ActivityLog, ActivityLogModule } from "../../models/activity-log.model.js";
import type { CreateLogInput } from "./dto/index.js";

type ListByUserIdParams = {
  userId: number;
  page: number;
  pageSize: number;
  sort: "asc" | "desc";
};

type FindAllWithFiltersParams = {
  module?: ActivityLogModule | undefined;
  userId?: number | undefined;
  limit: number;
  offset: number;
  order: "asc" | "desc";
};

interface ILogsRepository {
  create(data: CreateLogInput): Promise<ActivityLog>;
  listByUserId(params: ListByUserIdParams): Promise<{ rows: ActivityLog[]; count: number }>;
  findAllWithFilters(params: FindAllWithFiltersParams): Promise<{ rows: ActivityLog[]; count: number }>;
}

export type { ILogsRepository, ListByUserIdParams, FindAllWithFiltersParams };
