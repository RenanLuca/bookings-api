import bcrypt from "bcryptjs";
import { UniqueConstraintError } from "sequelize";
import { sequelize } from "../../config/db.js";
import { activityTypes } from "../../shared/constants/log-messages.js";
import {
  UserNotFoundError,
  UserEmailAlreadyExistsError
} from "./errors/index.js";
import { customersMessages } from "./constants/index.js";
import type { ActivityLogModule } from "../../models/activity-log.model.js";
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

  private async logActivity(userId: number, activityType: string, description: string, module: ActivityLogModule = "ACCOUNT") {
    await this.activityLogs.createLog({
      userId,
      module,
      activityType,
      description
    });
  }

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

  private async buildUserUpdates(
    profile: UserWithCustomer,
    input: UpdateProfileInput
  ): Promise<{ updates: UserData; emailChanged: boolean; oldEmail: string; newEmail: string }> {
    const updates: UserData = {};
    let emailChanged = false;
    let oldEmail = "";
    let newEmail = "";

    if (input.user?.name && input.user.name !== profile.name) {
      updates.name = input.user.name;
    }
    if (input.user?.email && input.user.email !== profile.email) {
      updates.email = input.user.email;
      emailChanged = true;
      oldEmail = profile.email;
      newEmail = input.user.email;
    }
    if (input.user?.password) {
      updates.passwordHash = await bcrypt.hash(input.user.password, 10);
    }

    return { updates, emailChanged, oldEmail, newEmail };
  }

  private copyIfPresent<T extends Record<string, unknown>>(
    source: T,
    target: Partial<T>,
    fields: (keyof T)[]
  ): void {
    for (const field of fields) {
      if (field in source) {
        target[field] = source[field];
      }
    }
  }

  private buildCustomerUpdates(input: UpdateProfileInput): CustomerUpdateData {
    const updates: CustomerUpdateData = {};
    const payload = input.customer ?? {};
    const customerFields: (keyof CustomerUpdateData)[] = [
      "zipCode",
      "street",
      "number",
      "complement",
      "neighborhood",
      "city",
      "state"
    ];

    this.copyIfPresent(payload, updates, customerFields);

    return updates;
  }

  private async logEmailChange(userId: number, oldEmail: string, newEmail: string): Promise<void> {
    const logDescription = `Alterou email de '${oldEmail}' para '${newEmail}'`;
    await this.logActivity(userId, activityTypes.PROFILE_UPDATE, logDescription);
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

  async updateProfile(userId: number, input: UpdateProfileInput): Promise<{ profile: ProfileResult; message: string }> {
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

      const userResult = await this.buildUserUpdates(profile, input);
      emailChanged = userResult.emailChanged;
      oldEmail = userResult.oldEmail;
      newEmail = userResult.newEmail;

      const customerUpdates = this.buildCustomerUpdates(input);

      const hasUserUpdates = Object.keys(userResult.updates).length > 0;
      const hasCustomerUpdates = Object.keys(customerUpdates).length > 0;

      if (hasUserUpdates) {
        await this.repository.updateUser(userId, userResult.updates, transaction);
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
      await this.logEmailChange(userId, oldEmail, newEmail);
    }

    return { profile: this.mapProfile(updatedProfile), message: customersMessages.update.success };
  }

  async register(input: RegisterInput): Promise<{ profile: ProfileResult; message: string }> {
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
      return { profile: this.mapProfile(profile), message: customersMessages.register.success };
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

  async softDeleteCustomer(id: number): Promise<{ message: string }> {
    const deleted = await this.repository.softDeleteById(id);
    if (!deleted) {
      throw new UserNotFoundError();
    }
    return { message: customersMessages.delete.success };
  }
}

export { CustomersService };
