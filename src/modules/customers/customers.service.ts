import bcrypt from "bcryptjs";
import { UniqueConstraintError } from "sequelize";
import { sequelize } from "../../config/db.js";
import { activityTypes } from "../../shared/constants/log-messages.js";
import {
  UserNotFoundError,
  UserEmailAlreadyExistsError
} from "./errors/index.js";
import type { ILogsService } from "../logs/logs.service.interface.js";
import type { IPermissionsService } from "../permissions/permissions.service.interface.js";
import type { ICustomersRepository } from "./customers.repository.interface.js";
import type {
  ListCustomersMeta,
  ListCustomersResult,
  ProfileResult,
  ProfileUser,
  RegisterInput,
  UpdateProfileInput,
  CustomerData,
  CustomerUpdateData,
  FindPaginatedParams,
  UserData,
  UserWithCustomer
} from "./dto/index.js";

class CustomersService {
  constructor(
    private readonly repository: ICustomersRepository,
    private readonly activityLogs: ILogsService,
    private readonly permissionsService: IPermissionsService
  ) {}

  private buildDefaultCustomerData(): CustomerData {
    return {
      zipCode: "",
      street: "",
      number: "",
      complement: null,
      neighborhood: "",
      city: "",
      state: ""
    };
  }

  private mapProfile(profile: UserWithCustomer): ProfileResult {
    const customer = profile.Customer ?? null;
    const user: ProfileUser = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      status: profile.status
    };
    return { user, customer };
  }

  async getProfile(userId: number) {
    let profile = await this.repository.findProfile(userId);
    if (!profile) {
      throw new UserNotFoundError();
    }
    if (!profile.Customer) {
      const defaults = this.buildDefaultCustomerData();
      await this.repository.createCustomer(userId, defaults);
      profile = await this.repository.findProfile(userId);
      if (!profile) {
        throw new UserNotFoundError();
      }
    }
    return this.mapProfile(profile);
  }

  async updateProfile(userId: number, input: UpdateProfileInput) {
    const transaction = await sequelize.transaction();
    let emailChanged = false;
    let oldEmail = "";
    let newEmail = "";
    try {
      let profile = await this.repository.findProfile(userId, transaction);
      if (!profile) {
        throw new UserNotFoundError();
      }
      let customer = profile.Customer;
      if (!customer) {
        const defaults = this.buildDefaultCustomerData();
        customer = await this.repository.createCustomer(userId, defaults, transaction);
      }
      const userUpdates: UserData = {};
      const customerUpdates: CustomerUpdateData = {};
      if (input.user?.name && input.user.name !== profile.name) {
        userUpdates.name = input.user.name;
      }
      if (input.user?.email && input.user.email !== profile.email) {
        userUpdates.email = input.user.email;
        emailChanged = true;
        oldEmail = profile.email;
        newEmail = input.user.email;
      }
      if (input.user?.password) {
        userUpdates.passwordHash = await bcrypt.hash(input.user.password, 10);
      }
      const customerPayload = input.customer ?? {};
      if (
        customerPayload.zipCode !== undefined &&
        customerPayload.zipCode !== customer.zipCode
      ) {
        customerUpdates.zipCode = customerPayload.zipCode;
      }
      if (
        customerPayload.street !== undefined &&
        customerPayload.street !== customer.street
      ) {
        customerUpdates.street = customerPayload.street;
      }
      if (
        customerPayload.number !== undefined &&
        customerPayload.number !== customer.number
      ) {
        customerUpdates.number = customerPayload.number;
      }
      if (
        customerPayload.complement !== undefined &&
        customerPayload.complement !== customer.complement
      ) {
        customerUpdates.complement = customerPayload.complement;
      }
      if (
        customerPayload.neighborhood !== undefined &&
        customerPayload.neighborhood !== customer.neighborhood
      ) {
        customerUpdates.neighborhood = customerPayload.neighborhood;
      }
      if (
        customerPayload.city !== undefined &&
        customerPayload.city !== customer.city
      ) {
        customerUpdates.city = customerPayload.city;
      }
      if (
        customerPayload.state !== undefined &&
        customerPayload.state !== customer.state
      ) {
        customerUpdates.state = customerPayload.state;
      }
      const hasUserUpdates = Object.keys(userUpdates).length > 0;
      const hasCustomerUpdates = Object.keys(customerUpdates).length > 0;
      if (hasUserUpdates) {
        await this.repository.updateUser(userId, userUpdates, transaction);
      }
      if (hasCustomerUpdates) {
        await this.repository.updateCustomer(userId, customerUpdates, transaction);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof UniqueConstraintError) {
        throw new UserEmailAlreadyExistsError();
      }
      throw error;
    }
    const updatedProfile = await this.repository.findProfile(userId);
    if (!updatedProfile) {
      throw new UserNotFoundError();
    }
    if (emailChanged) {
      const logDescription = `Alterou email de '${oldEmail}' para '${newEmail}'`;
      await this.activityLogs.createLog({
        userId,
        module: "ACCOUNT",
        activityType: activityTypes.PROFILE_UPDATE,
        description: logDescription
      });
    }
    return this.mapProfile(updatedProfile);
  }

  async register(input: RegisterInput): Promise<ProfileResult> {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const customerData: CustomerData = {
      zipCode: input.customer?.zipCode ?? "",
      street: input.customer?.street ?? "",
      number: input.customer?.number ?? "",
      complement: input.customer?.complement ?? null,
      neighborhood: input.customer?.neighborhood ?? "",
      city: input.customer?.city ?? "",
      state: input.customer?.state ?? ""
    };
    const transaction = await sequelize.transaction();
    try {
      const profile = await this.repository.createUserWithCustomer(
        {
          name: input.name,
          email: input.email,
          passwordHash,
          role: "CUSTOMER",
          status: "ACTIVE",
          customer: customerData
        },
        transaction
      );
      if (!profile || !profile.Customer) {
        throw new UserNotFoundError();
      }
      await this.permissionsService.createDefaultPermissions(
        profile.Customer.id,
        transaction
      );
      await transaction.commit();
      return this.mapProfile(profile);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof UniqueConstraintError) {
        throw new UserEmailAlreadyExistsError();
      }
      throw error;
    }
  }

  async listCustomers(params: FindPaginatedParams): Promise<ListCustomersResult> {
    const { rows, count } = await this.repository.findPaginated(params);
    const data = rows.map((row) => this.mapProfile(row));
    const meta: ListCustomersMeta = {
      page: params.page,
      pageSize: params.pageSize,
      total: count,
      sort: params.sort
    };
    return { data, meta };
  }

  async getCustomerById(id: number): Promise<ProfileResult> {
    const profile = await this.repository.findById(id);
    if (!profile) {
      throw new UserNotFoundError();
    }
    return this.mapProfile(profile);
  }

  async softDeleteCustomer(id: number): Promise<void> {
    const deleted = await this.repository.softDeleteById(id);
    if (!deleted) {
      throw new UserNotFoundError();
    }
  }
}

export { CustomersService };
