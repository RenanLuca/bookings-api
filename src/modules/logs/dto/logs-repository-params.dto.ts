import type { ActivityLogModule } from "../../../models/activity-log.model.js";

export type ListByUserIdParams = {
  userId: number;
  page: number;
  pageSize: number;
  sort: "asc" | "desc";
  from?: Date;
  to?: Date;
  search?: string;
};

export type FindAllWithFiltersParams = {
  module?: ActivityLogModule;
  userId?: number;
  page: number;
  pageSize: number;
  sort: "asc" | "desc";
  from?: Date;
  to?: Date;
  search?: string;
};
