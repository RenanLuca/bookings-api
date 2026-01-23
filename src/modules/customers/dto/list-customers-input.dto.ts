import type { SortDirection } from "./sort-direction.dto.js";

export type ListCustomersInput = {
  page?: number;
  pageSize?: number;
  sort?: SortDirection;
  name?: string;
  from?: string;
  to?: string;
};
