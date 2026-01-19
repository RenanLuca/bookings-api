export type ListLogsInput = {
  page: number;
  pageSize: number;
  sort: "asc" | "desc";
  from?: Date;
  to?: Date;
  search?: string;
};
