import type { Customer } from "../../models/customer.model.js";
import type { UserRole, UserStatus } from "../../models/user.model.js";
import type { User } from "../../models/index.js";

type UserWithCustomer = User & { Customer?: Customer | null };

type CustomerData = {
  zipCode: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
};

type CustomerUpdateData = Partial<CustomerData>;

type UserData = Partial<{
  name: string;
  email: string;
  passwordHash: string;
}>;

type SortDirection = "asc" | "desc";

type FindPaginatedParams = {
  page: number;
  pageSize: number;
  name?: string;
  sort: SortDirection;
};

type CreateUserWithCustomerParams = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  customer: CustomerData;
};

export type {
  CreateUserWithCustomerParams,
  CustomerData,
  CustomerUpdateData,
  FindPaginatedParams,
  SortDirection,
  UserData,
  UserWithCustomer
};
