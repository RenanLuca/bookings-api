import type { Customer } from "../../models/customer.model.js";
import type { UserRole, UserStatus } from "../../models/user.model.js";
import type { CustomerData } from "./customers.types.js";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  customer?: Partial<CustomerData>;
};

type UpdateProfileInput = {
  user?: {
    name?: string;
    email?: string;
    password?: string;
  };
  customer?: Partial<CustomerData>;
};

type ProfileUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

type ProfileCustomer = Customer | null;

type ProfileResult = {
  user: ProfileUser;
  customer: ProfileCustomer;
};

type ListCustomersMeta = {
  page: number;
  pageSize: number;
  total: number;
  sort: "asc" | "desc";
};

type ListCustomersResult = {
  data: ProfileResult[];
  meta: ListCustomersMeta;
};

export type {
  ListCustomersMeta,
  ListCustomersResult,
  ProfileCustomer,
  ProfileResult,
  ProfileUser,
  RegisterInput,
  UpdateProfileInput
};
