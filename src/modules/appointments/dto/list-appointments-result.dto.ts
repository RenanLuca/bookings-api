import type { AppointmentResponse } from "./appointment-response.dto.js";
import type { ListAppointmentsMeta } from "./list-appointments-meta.dto.js";

export type ListAppointmentsResult = {
  data: AppointmentResponse[];
  meta: ListAppointmentsMeta;
};
