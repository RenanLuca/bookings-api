import type { Pagination } from "./pagination.dto.js";
import type { DateRangeFilter } from "./date-range-filter.dto.js";

export type ListParams = Pagination &
  DateRangeFilter & {
    customerId?: number;
  };
