import { CustomerNotFoundError } from "../customers/errors/index.js";
import { RoomNotFoundError } from "../rooms/errors/index.js";
import {
  AppointmentConflictError,
  AppointmentNotFoundError,
  AppointmentInvalidStatusError,
  AppointmentForbiddenError
} from "./errors/index.js";
import type { UserRole } from "../../models/user.model.js";
import { activityTypes } from "../../shared/constants/log-messages.js";
import { toAppIsoStringFromUtc, toUtcFromAppTz } from "../../shared/utils/datetime.js";
import type { ILogsService } from "../logs/logs.service.interface.js";
import type { IPermissionsService } from "../permissions/permissions.service.interface.js";
import type { IAppointmentsRepository } from "./appointments.repository.interface.js";
import type {
  AppointmentCustomer,
  AppointmentResponse,
  CreateAppointmentInput,
  ListAppointmentsResult,
  ListFiltersInput,
  AppointmentWithRelations,
  QueryFilters
} from "./dto/index.js";

class AppointmentsService {
  constructor(
    private readonly repository: IAppointmentsRepository,
    private readonly activityLogs: ILogsService,
    private readonly permissionsService: IPermissionsService
  ) { }

  private async logActivity(userId: number, activityType: string, description: string) {
    await this.activityLogs.createLog({
      userId,
      module: "APPOINTMENT",
      activityType,
      description
    });
  }

  private toDate(value: string): Date {
    return toUtcFromAppTz(value.trim());
  }

  private toDateOrUndefined(value?: string): Date | undefined {
    if (value === undefined) {
      return undefined;
    }
    return toUtcFromAppTz(value.trim());
  }

  private toAppointmentResponse(record: AppointmentWithRelations): AppointmentResponse {
    const scheduledAt = toAppIsoStringFromUtc(record.scheduledAt);
    const room =
      record.Room && record.Room.id
        ? { id: record.Room.id, name: record.Room.name }
        : undefined;
    let customer: AppointmentCustomer | undefined;
    if (record.Customer && record.Customer.id) {
      customer = { id: record.Customer.id };
      if (record.Customer.User?.name !== undefined) {
        customer.name = record.Customer.User.name;
      }
      if (record.Customer.User?.email !== undefined) {
        customer.email = record.Customer.User.email;
      }
    }
    const response: AppointmentResponse = {
      id: record.id,
      roomId: record.roomId,
      customerId: record.customerId,
      status: record.status,
      scheduledAt
    };
    if (room) {
      response.room = room;
    }
    if (customer) {
      response.customer = customer;
    }
    return response;
  }

  private buildMeta(params: QueryFilters, total: number) {
    return {
      page: params.page,
      pageSize: params.pageSize,
      total,
      sort: params.sort
    };
  }

  private buildLogDescription(prefix: string, record: AppointmentWithRelations) {
    const dateTime = toAppIsoStringFromUtc(record.scheduledAt);
    const roomName = record.Room?.name ?? `Sala ${record.roomId}`;
    const customerName = record.Customer?.User?.name;
    if (customerName) {
      return `${prefix} para ${customerName} na ${roomName} em ${dateTime}`;
    }
    return `${prefix} na ${roomName} em ${dateTime}`;
  }

  private buildQueryFilters(input: ListFiltersInput, customerId?: number): QueryFilters {
    const from = this.toDateOrUndefined(input.from);
    const to = this.toDateOrUndefined(input.to);

    return {
      page: input.page,
      pageSize: input.pageSize,
      sort: input.sort,
      ...(from !== undefined ? { from } : {}),
      ...(to !== undefined ? { to } : {}),
      ...(customerId !== undefined ? { customerId } : {})
    };
  }

  async createAppointment(userId: number, input: CreateAppointmentInput) {
    const roomId = input.roomId;
    const scheduledAt = this.toDate(input.scheduledAt);
    const customer = await this.repository.findCustomerByUserId(userId);
    if (!customer) {
      throw new CustomerNotFoundError();
    }
    await this.permissionsService.assertCanViewModule(customer.id, "APPOINTMENTS");
    const room = await this.repository.findRoomById(roomId);
    if (!room) {
      throw new RoomNotFoundError();
    }
    const conflict = await this.repository.findConflict(roomId, scheduledAt);
    if (conflict) {
      throw new AppointmentConflictError();
    }
    const appointment = await this.repository.create({
      roomId,
      customerId: customer.id,
      scheduledAt
    });
    const record = await this.repository.findByIdWithRelations(appointment.id);
    if (!record) {
      throw new AppointmentNotFoundError();
    }
    const logDescription = this.buildLogDescription(
      "Criação de agendamento",
      record
    );
    await this.logActivity(userId, activityTypes.APPOINTMENT_CREATE, logDescription);
    return this.toAppointmentResponse(record);
  }

  async listMyAppointments(userId: number, input: ListFiltersInput): Promise<ListAppointmentsResult> {
    const customer = await this.repository.findCustomerByUserId(userId);
    if (!customer) {
      throw new CustomerNotFoundError();
    }
    await this.permissionsService.assertCanViewModule(customer.id, "APPOINTMENTS");

    const params = this.buildQueryFilters(input, customer.id);
    const { rows, count } = await this.repository.list(params);

    return {
      data: rows.map((row) => this.toAppointmentResponse(row)),
      meta: this.buildMeta(params, count)
    };
  }

  async listAll(input: ListFiltersInput): Promise<ListAppointmentsResult> {
    const params = this.buildQueryFilters(input);
    const { rows, count } = await this.repository.list(params);

    return {
      data: rows.map((row) => this.toAppointmentResponse(row)),
      meta: this.buildMeta(params, count)
    };
  }

  async acceptAppointment(id: number, actorId: number) {
    const appointment = await this.repository.findByIdWithRelations(id);
    if (!appointment) {
      throw new AppointmentNotFoundError();
    }
    if (appointment.status !== "PENDING") {
      throw new AppointmentInvalidStatusError();
    }
    const updated = await this.repository.updateStatus(id, "SCHEDULED");
    if (!updated) {
      throw new AppointmentNotFoundError();
    }
    const logDescription = this.buildLogDescription(
      "Aceite de agendamento",
      updated
    );
    await this.logActivity(actorId, activityTypes.APPOINTMENT_ACCEPT, logDescription);
    return this.toAppointmentResponse(updated);
  }

  async cancelAppointment(id: number, actorId: number, role: UserRole) {
    const appointment = await this.repository.findByIdWithRelations(id);
    if (!appointment) {
      throw new AppointmentNotFoundError();
    }
    if (role === "CUSTOMER") {
      const customer = await this.repository.findCustomerByUserId(actorId);
      if (!customer || appointment.customerId !== customer.id) {
        throw new AppointmentForbiddenError();
      }
    }
    const isAllowed = appointment.status === "PENDING" || appointment.status === "SCHEDULED";
    if (!isAllowed) {
      throw new AppointmentInvalidStatusError();
    }
    const updated = await this.repository.updateStatus(id, "CANCELED");
    if (!updated) {
      throw new AppointmentNotFoundError();
    }
    const logDescription = this.buildLogDescription(
      "Cancelamento de agendamento",
      updated
    );
    await this.logActivity(actorId, activityTypes.APPOINTMENT_CANCEL, logDescription);
    return this.toAppointmentResponse(updated);
  }
}

export { AppointmentsService };
