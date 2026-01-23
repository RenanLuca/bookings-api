export type ListLogsInput = {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  from?: string;
  to?: string;
  search?: string;
};
