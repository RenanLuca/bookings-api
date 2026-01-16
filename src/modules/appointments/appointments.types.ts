import type { Appointment } from "../../models/appointment.model.js";
import type { Customer, Room, User } from "../../models/index.js";

type SortDirection = "asc" | "desc";

type DateRangeFilter = {
  from?: Date;
  to?: Date;
};

type Pagination = {
  page: number;
  pageSize: number;
  sort: SortDirection;
};

type ListParams = Pagination &
  DateRangeFilter & {
    customerId?: number;
  };

type CreateAppointmentParams = {
  customerId: number;
  roomId: number;
  scheduledAt: Date;
};

type QueryFilters = {
  page: number;
  pageSize: number;
  sort: "asc" | "desc";
  from?: Date;
  to?: Date;
  customerId?: number;
};

type AppointmentWithRelations = Appointment & {
  Room?: Room | null;
  Customer?: (Customer & { User?: User | null }) | null;
};

export type {
  AppointmentWithRelations,
  CreateAppointmentParams,
  DateRangeFilter,
  ListParams,
  Pagination,
  QueryFilters,
  SortDirection
};
