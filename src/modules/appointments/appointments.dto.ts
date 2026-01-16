import type { AppointmentStatus } from "../../models/appointment.model.js";

type CreateAppointmentInput = {
  roomId: number;
  scheduledAt: string;
};

type ListFiltersInput = {
  page: number;
  pageSize: number;
  sort: "asc" | "desc";
  from?: string;
  to?: string;
};

type AppointmentRoom = {
  id: number;
  name: string;
};

type AppointmentCustomer = {
  id: number;
  name?: string;
  email?: string;
};

type AppointmentResponse = {
  id: number;
  roomId: number;
  customerId: number;
  scheduledAt: string;
  status: AppointmentStatus;
  room?: AppointmentRoom;
  customer?: AppointmentCustomer;
};

type ListAppointmentsMeta = {
  page: number;
  pageSize: number;
  total: number;
  sort: "asc" | "desc";
};

type ListAppointmentsResult = {
  data: AppointmentResponse[];
  meta: ListAppointmentsMeta;
};

export type {
  AppointmentCustomer,
  AppointmentResponse,
  AppointmentRoom,
  CreateAppointmentInput,
  ListAppointmentsMeta,
  ListAppointmentsResult,
  ListFiltersInput
};
