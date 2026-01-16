import type { ActivityLogModule } from "../../models/activity-log.model.js";

type CreateLogInput = {
  userId: number | null;
  module: ActivityLogModule;
  activityType: string;
  description: string;
};

type ListLogsInput = {
  page: number;
  pageSize: number;
  sort: "asc" | "desc";
};

type ListAllLogsInput = {
  page: number;
  pageSize: number;
  sort: "asc" | "desc";
  module?: ActivityLogModule | undefined;
  userId?: number | undefined;
};

type LogResponse = {
  id: number;
  module: ActivityLogModule;
  activityType: string;
  description: string;
  createdAt: string;
};

type ListLogsMeta = {
  page: number;
  pageSize: number;
  total: number;
  sort: "asc" | "desc";
};

type ListLogsResult = {
  data: LogResponse[];
  meta: ListLogsMeta;
};

export type { CreateLogInput, ListLogsInput, ListAllLogsInput, LogResponse, ListLogsMeta, ListLogsResult };
