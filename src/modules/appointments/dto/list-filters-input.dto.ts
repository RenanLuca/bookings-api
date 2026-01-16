export type ListFiltersInput = {
  page: number;
  pageSize: number;
  sort: "asc" | "desc";
  from?: string;
  to?: string;
};
