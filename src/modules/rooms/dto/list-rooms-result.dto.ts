import type { Room } from "../../../models/room.model.js";
import type { ListRoomsMeta } from "./list-rooms-meta.dto.js";

export type ListRoomsResult = {
  data: Room[];
  meta: ListRoomsMeta;
};
