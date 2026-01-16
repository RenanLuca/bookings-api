export type QueryFilters = {
  page: number;
  pageSize: number;
  sort: "asc" | "desc";
  from?: Date;
  to?: Date;
  customerId?: number;
};
