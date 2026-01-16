type SortDirection = "asc" | "desc";

type FindPaginatedParams = {
  page: number;
  pageSize: number;
  name?: string;
  sort: SortDirection;
};

type CreateRoomParams = {
  name: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
};

type UpdateRoomParams = Partial<CreateRoomParams>;

type NormalizedTime = {
  normalized: string;
  totalSeconds: number;
};

export type {
  CreateRoomParams,
  FindPaginatedParams,
  NormalizedTime,
  SortDirection,
  UpdateRoomParams
};
