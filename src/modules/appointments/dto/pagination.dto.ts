import type { SortDirection } from "./sort-direction.dto.js";

export type Pagination = {
  page: number;
  pageSize: number;
  sort: SortDirection;
};
