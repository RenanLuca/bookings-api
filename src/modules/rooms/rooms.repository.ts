import { Op } from "sequelize";
import { Room } from "../../models/index.js";
import type {
  CreateRoomParams,
  FindPaginatedParams,
  UpdateRoomParams
} from "./dto/index.js";
import type { IRoomsRepository } from "./rooms.repository.interface.js";

class RoomsRepository implements IRoomsRepository {
  async findPaginated(params: FindPaginatedParams) {
    const where: Record<string, unknown> = {};
    if (params.name) {
      where.name = { [Op.substring]: params.name };
    }
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sort = params.sort ?? "desc";
    const offset = (page - 1) * pageSize;
    const orderDirection = sort === "asc" ? "ASC" : "DESC";
    const { rows, count } = await Room.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [["createdAt", orderDirection]]
    });
    return { rows, count };
  }

  async findById(id: number) {
    return Room.findByPk(id);
  }

  async create(data: CreateRoomParams) {
    return Room.create(data);
  }

  async updateById(id: number, data: UpdateRoomParams) {
    const [updated] = await Room.update(data, { where: { id } });
    if (!updated) {
      return null;
    }
    return this.findById(id);
  }

  async softDeleteById(id: number) {
    return Room.destroy({ where: { id } });
  }
}

export { RoomsRepository };
