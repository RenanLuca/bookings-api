import type { Appointment } from "../../../models/appointment.model.js";
import type { Customer, Room, User } from "../../../models/index.js";

export type AppointmentWithRelations = Appointment & {
  Room?: Room | null;
  Customer?: (Customer & { User?: User | null }) | null;
};
