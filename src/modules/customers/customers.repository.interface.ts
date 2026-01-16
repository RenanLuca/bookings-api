import type { Transaction } from "sequelize";
import type { Customer } from "../../models/customer.model.js";
import type { User } from "../../models/user.model.js";
import type {
  CreateUserWithCustomerParams,
  CustomerData,
  CustomerUpdateData,
  FindPaginatedParams,
  UserData,
  UserWithCustomer
} from "./dto/index.js";

interface ICustomersRepository {
  findProfile(userId: number, transaction?: Transaction): Promise<UserWithCustomer | null>;
  findCustomerByUserId(userId: number, transaction?: Transaction): Promise<Customer | null>;
  createCustomer(userId: number, data: CustomerData, transaction?: Transaction): Promise<Customer>;
  updateUser(userId: number, data: UserData, transaction: Transaction): Promise<[affectedCount: number]>;
  updateCustomer(userId: number, data: CustomerUpdateData, transaction: Transaction): Promise<[affectedCount: number]>;
  findPaginated(params: FindPaginatedParams): Promise<{ rows: UserWithCustomer[]; count: number }>;
  findById(id: number): Promise<UserWithCustomer | null>;
  findByEmail(email: string): Promise<User | null>;
  createUserWithCustomer(data: CreateUserWithCustomerParams, transaction: Transaction): Promise<UserWithCustomer | null>;
  softDeleteById(id: number): Promise<number>;
}

export type { ICustomersRepository };
