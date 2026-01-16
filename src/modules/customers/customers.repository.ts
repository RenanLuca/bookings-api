import type { FindOptions, Transaction } from "sequelize";
import { Op } from "sequelize";
import { Customer, User } from "../../models/index.js";
import type {
  CreateUserWithCustomerParams,
  CustomerData,
  CustomerUpdateData,
  FindPaginatedParams,
  UserData,
  UserWithCustomer
} from "./dto/index.js";
import type { ICustomersRepository } from "./customers.repository.interface.js";

class CustomersRepository implements ICustomersRepository {
  async findProfile(
    userId: number,
    transaction?: Transaction
  ): Promise<UserWithCustomer | null> {
    const options: FindOptions = {
      where: { id: userId },
      attributes: { exclude: ["passwordHash"] },
      include: [{ model: Customer }]
    };
    if (transaction) {
      options.transaction = transaction;
    }
    const profile = await User.findOne(options);
    return profile as UserWithCustomer | null;
  }

  async findCustomerByUserId(userId: number, transaction?: Transaction) {
    const options: FindOptions = { where: { userId } };
    if (transaction) {
      options.transaction = transaction;
    }
    return Customer.findOne(options);
  }

  async createCustomer(
    userId: number,
    data: CustomerData,
    transaction?: Transaction
  ) {
    const options: { transaction?: Transaction } = {};
    if (transaction) {
      options.transaction = transaction;
    }
    return Customer.create({ userId, ...data }, options);
  }

  async updateUser(
    userId: number,
    data: UserData,
    transaction: Transaction
  ) {
    const options: { where: { id: number }; transaction?: Transaction } = {
      where: { id: userId }
    };
    if (transaction) {
      options.transaction = transaction;
    }
    return User.update(data, options);
  }

  async updateCustomer(
    userId: number,
    data: CustomerUpdateData,
    transaction: Transaction
  ) {
    const options: { where: { userId: number }; transaction?: Transaction } = {
      where: { userId }
    };
    if (transaction) {
      options.transaction = transaction;
    }
    return Customer.update(data, options);
  }

  async findPaginated(params: FindPaginatedParams) {
    const where: Record<string, unknown> = { role: "CUSTOMER" };
    if (params.name) {
      where.name = { [Op.substring]: params.name };
    }
    const offset = (params.page - 1) * params.pageSize;
    const orderDirection = params.sort === "asc" ? "ASC" : "DESC";
    const { rows, count } = await User.findAndCountAll({
      where,
      limit: params.pageSize,
      offset,
      order: [["createdAt", orderDirection]],
      attributes: { exclude: ["passwordHash"] },
      include: [{ model: Customer }]
    });
    return { rows: rows as UserWithCustomer[], count };
  }

  async findById(id: number): Promise<UserWithCustomer | null> {
    const user = await User.findOne({
      where: { id, role: "CUSTOMER" },
      attributes: { exclude: ["passwordHash"] },
      include: [{ model: Customer }]
    });
    return user as UserWithCustomer | null;
  }

  async findByEmail(email: string) {
    return User.findOne({ where: { email } });
  }

  async createUserWithCustomer(
    data: CreateUserWithCustomerParams,
    transaction: Transaction
  ): Promise<UserWithCustomer | null> {
    const user = await User.create(
      {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        status: data.status
      },
      { transaction }
    );
    await Customer.create(
      { userId: user.id, ...data.customer },
      { transaction }
    );
    return this.findProfile(user.id, transaction);
  }

  async softDeleteById(id: number) {
    return User.destroy({ where: { id, role: "CUSTOMER" } });
  }
}

export { CustomersRepository };
