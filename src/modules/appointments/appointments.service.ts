import { CustomerNotFoundError } from "../customers/errors/index.js";
import { RoomNotFoundError } from "../rooms/errors/index.js";
import {
  AppointmentConflictError,
  AppointmentNotFoundError,
  AppointmentInvalidStatusError,
  AppointmentForbiddenError,
  AppointmentOutsideRoomHoursError,
  AppointmentDateInPastError
} from "./errors/index.js";
import { appointmentsMessages } from "./constants/index.js";
import type { UserRole } from "../../models/user.model.js";
import { activityTypes } from "../../shared/constants/log-messages.js";
import {
  toAppIsoStringFromUtc,
  toAppTzFromUtc,
  toUtcFromAppTz,
  toUtcIsoString,
  toUtcStartOfDayFromAppTz,
  toUtcEndOfDayFromAppTz
} from "../../shared/utils/datetime.js";
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

  private getTimeSecondsFromRoomTime(value: string): number {
    const trimmed = value.trim();
    const segments = trimmed.split(":");
    const hours = Number.parseInt(segments[0] ?? "0", 10);
    const minutes = Number.parseInt(segments[1] ?? "0", 10);
    const seconds = Number.parseInt(segments[2] ?? "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  private getScheduledSecondsInAppTimezone(scheduledAt: Date): number {
    const localDate = toAppTzFromUtc(scheduledAt);
    return localDate.getHours() * 3600 + localDate.getMinutes() * 60 + localDate.getSeconds();
  }

  private isScheduledWithinRoomHours(
    room: { startTime: string; endTime: string },
    scheduledAt: Date
  ): boolean {
    const scheduledSeconds = this.getScheduledSecondsInAppTimezone(scheduledAt);
    const startSeconds = this.getTimeSecondsFromRoomTime(room.startTime);
    const endSeconds = this.getTimeSecondsFromRoomTime(room.endTime);
    return scheduledSeconds >= startSeconds && scheduledSeconds <= endSeconds;
  }

  private getTodayStartUtc(): Date {
    const nowInAppTimezone = toAppIsoStringFromUtc(new Date());
    const todayDate = nowInAppTimezone.split("T")[0] ?? "";
    return toUtcStartOfDayFromAppTz(todayDate);
  }

  private isScheduledBeforeToday(scheduledAt: Date): boolean {
    const todayStartUtc = this.getTodayStartUtc();
    return scheduledAt < todayStartUtc;
  }


  private toAppointmentResponse(record: AppointmentWithRelations): AppointmentResponse {
    const scheduledAt = toUtcIsoString(record.scheduledAt);
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
    const dateTime = toUtcIsoString(record.scheduledAt);
    const roomName = record.Room?.name ?? `Sala ${record.roomId}`;
    const customerName = record.Customer?.User?.name;
    if (customerName) {
      return `${prefix} para ${customerName} na ${roomName} em ${dateTime}`;
    }
    return `${prefix} na ${roomName} em ${dateTime}`;
  }

  private buildQueryFilters(input: ListFiltersInput, customerId?: number): QueryFilters {
    const from = input.from ? toUtcStartOfDayFromAppTz(input.from.trim()) : undefined;
    const to = input.to ? toUtcEndOfDayFromAppTz(input.to.trim()) : undefined;

    return {
      page: input.page,
      pageSize: input.pageSize,
      sort: input.sort,
      ...(from !== undefined ? { from } : {}),
      ...(to !== undefined ? { to } : {}),
      ...(customerId !== undefined ? { customerId } : {}),
      ...(input.search !== undefined ? { search: input.search.trim() } : {})
    };
  }

  async createAppointment(userId: number, input: CreateAppointmentInput): Promise<{ appointment: AppointmentResponse; message: string }> {
    const roomId = input.roomId;
    const scheduledAt = this.toDate(input.scheduledAt);
    if (this.isScheduledBeforeToday(scheduledAt)) {
      throw new AppointmentDateInPastError();
    }
    const customer = await this.repository.findCustomerByUserId(userId);
    if (!customer) {
      throw new CustomerNotFoundError();
    }
    await this.permissionsService.assertCanViewModule(customer.id, "APPOINTMENTS");
    const room = await this.repository.findRoomById(roomId);
    if (!room) {
      throw new RoomNotFoundError();
    }
    const isWithinRoomHours = this.isScheduledWithinRoomHours(room, scheduledAt);
    if (!isWithinRoomHours) {
      throw new AppointmentOutsideRoomHoursError();
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
    return { appointment: this.toAppointmentResponse(record), message: appointmentsMessages.create.success };
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

  async acceptAppointment(id: number, actorId: number): Promise<{ appointment: AppointmentResponse; message: string }> {
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
    return { appointment: this.toAppointmentResponse(updated), message: appointmentsMessages.accept.success };
  }

  async cancelAppointment(id: number, actorId: number, role: UserRole): Promise<{ appointment: AppointmentResponse; message: string }> {
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
    return { appointment: this.toAppointmentResponse(updated), message: appointmentsMessages.cancel.success };
  }
}

export { AppointmentsService };
