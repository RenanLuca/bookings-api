import type { Appointment, AppointmentStatus } from "../../models/appointment.model.js";
import type { Customer } from "../../models/customer.model.js";
import type { Room } from "../../models/room.model.js";
import type { CreateAppointmentParams, ListParams } from "./dto/index.js";

interface IAppointmentsRepository {
  findCustomerByUserId(userId: number): Promise<Customer | null>;
  findRoomById(id: number): Promise<Room | null>;
  findConflict(roomId: number, scheduledAt: Date): Promise<Appointment | null>;
  create(data: CreateAppointmentParams): Promise<Appointment>;
  findByIdWithRelations(id: number): Promise<Appointment | null>;
  list(params: ListParams): Promise<{ rows: Appointment[]; count: number }>;
  updateStatus(id: number, status: AppointmentStatus): Promise<Appointment | null>;
}

export type { IAppointmentsRepository };
