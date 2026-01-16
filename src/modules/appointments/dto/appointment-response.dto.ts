import type { AppointmentStatus } from "../../../models/appointment.model.js";
import type { AppointmentRoom } from "./appointment-room.dto.js";
import type { AppointmentCustomer } from "./appointment-customer.dto.js";

export type AppointmentResponse = {
  id: number;
  roomId: number;
  customerId: number;
  scheduledAt: string;
  status: AppointmentStatus;
  room?: AppointmentRoom;
  customer?: AppointmentCustomer;
};
