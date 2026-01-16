import type { ActivityLogModule } from "../../../models/activity-log.model.js";

export type ListAllLogsInput = {
  page: number;
  pageSize: number;
  sort: "asc" | "desc";
  module?: ActivityLogModule | undefined;
  userId?: number | undefined;
};
