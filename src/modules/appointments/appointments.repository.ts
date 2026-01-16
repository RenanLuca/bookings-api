import { Op, type FindAndCountOptions, type OrderItem } from "sequelize";
import {
  Appointment,
  Customer,
  Room,
  User
} from "../../models/index.js";
import type { AppointmentStatus } from "../../models/appointment.model.js";
import type {
  CreateAppointmentParams,
  ListParams,
  SortDirection
} from "./dto/index.js";
import type { IAppointmentsRepository } from "./appointments.repository.interface.js";

class AppointmentsRepository implements IAppointmentsRepository {
  async findCustomerByUserId(userId: number) {
    return Customer.findOne({ where: { userId } });
  }

  async findRoomById(id: number) {
    return Room.findByPk(id);
  }

  async findConflict(roomId: number, scheduledAt: Date) {
    const conflict = await Appointment.findOne({
      where: {
        roomId,
        scheduledAt,
        status: { [Op.ne]: "CANCELED" }
      }
    });

    return conflict;
  }

  async create(data: CreateAppointmentParams) {
    try {
      return await Appointment.create({ ...data, status: "PENDING" });
    } catch (error) {
      throw error;
    }
  }

  async findByIdWithRelations(id: number) {
    return Appointment.findByPk(id, {
      include: [
        { model: Room },
        { model: Customer, include: [{ model: User, attributes: ["name", "email"] }] }
      ]
    });
  }

  private buildWhere(params: ListParams) {
    const where: Record<string, unknown> = {};
    if (params.customerId !== undefined) {
      where.customerId = params.customerId;
    }
    if (params.from || params.to) {
      const range: { [key: symbol]: Date } = {};
      if (params.from) {
        range[Op.gte] = params.from;
      }
      if (params.to) {
        range[Op.lte] = params.to;
      }
      where.scheduledAt = range;
    }
    return where;
  }

  private buildOrder(sort: SortDirection): OrderItem[] {
    const direction = sort === "asc" ? "ASC" : "DESC";
    return [["scheduledAt", direction]];
  }

  async list(params: ListParams) {
    const offset = (params.page - 1) * params.pageSize;
    const where = this.buildWhere(params);
    const order = this.buildOrder(params.sort);
    const options: FindAndCountOptions = {
      where,
      limit: params.pageSize,
      offset,
      order,
      include: [
        { model: Room },
        { model: Customer, include: [{ model: User, attributes: ["name", "email"] }] }
      ]
    };
    return Appointment.findAndCountAll(options);
  }

  async updateStatus(id: number, status: AppointmentStatus) {
    const [updated] = await Appointment.update(
      { status },
      { where: { id } }
    );
    if (!updated) {
      return null;
    }
    return this.findByIdWithRelations(id);
  }
}

export { AppointmentsRepository };
