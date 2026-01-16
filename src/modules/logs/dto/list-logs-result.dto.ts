import type { LogResponse } from "./log-response.dto.js";
import type { ListLogsMeta } from "./list-logs-meta.dto.js";

export type ListLogsResult = {
  data: LogResponse[];
  meta: ListLogsMeta;
};
