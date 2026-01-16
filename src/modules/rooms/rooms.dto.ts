import type { Room } from "../../models/room.model.js";

type CreateRoomInput = {
  name: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
};

type UpdateRoomInput = {
  name?: string;
  startTime?: string;
  endTime?: string;
  slotDurationMinutes?: number;
};

type ListRoomsMeta = {
  page: number;
  pageSize: number;
  total: number;
  sort: "asc" | "desc";
};

type ListRoomsResult = {
  data: Room[];
  meta: ListRoomsMeta;
};

export type {
  CreateRoomInput,
  ListRoomsMeta,
  ListRoomsResult,
  UpdateRoomInput
};
