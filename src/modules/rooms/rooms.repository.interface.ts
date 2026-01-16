import type { Room } from "../../models/room.model.js";
import type {
  CreateRoomParams,
  FindPaginatedParams,
  UpdateRoomParams
} from "./rooms.types.js";

interface IRoomsRepository {
  findPaginated(params: FindPaginatedParams): Promise<{ rows: Room[]; count: number }>;
  findById(id: number): Promise<Room | null>;
  create(data: CreateRoomParams): Promise<Room>;
  updateById(id: number, data: UpdateRoomParams): Promise<Room | null>;
  softDeleteById(id: number): Promise<number>;
}

export type { IRoomsRepository };
