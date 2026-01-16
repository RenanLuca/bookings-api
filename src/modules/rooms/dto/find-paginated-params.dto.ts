import type { SortDirection } from "./sort-direction.dto.js";

export type FindPaginatedParams = {
  page: number;
  pageSize: number;
  name?: string;
  sort: SortDirection;
};
