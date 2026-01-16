import { AppointmentsRepository } from "../../modules/appointments/appointments.repository.js";
import { AuthRepository } from "../../modules/auth/auth.repository.js";
import { CustomersRepository } from "../../modules/customers/customers.repository.js";
import { LogsRepository } from "../../modules/logs/logs.repository.js";
import { PermissionsRepository } from "../../modules/permissions/permissions.repository.js";
import { RoomsRepository } from "../../modules/rooms/rooms.repository.js";
import type { IAppointmentsRepository } from "../../modules/appointments/appointments.repository.interface.js";
import type { IAuthRepository } from "../../modules/auth/auth.repository.interface.js";
import type { ICustomersRepository } from "../../modules/customers/customers.repository.interface.js";
import type { ILogsRepository } from "../../modules/logs/logs.repository.interface.js";
import type { IPermissionsRepository } from "../../modules/permissions/permissions.repository.interface.js";
import type { IRoomsRepository } from "../../modules/rooms/rooms.repository.interface.js";

class RepositoryFactory {
  private static logsRepository: ILogsRepository | null = null;
  private static authRepository: IAuthRepository | null = null;
  private static appointmentsRepository: IAppointmentsRepository | null = null;
  private static customersRepository: ICustomersRepository | null = null;
  private static permissionsRepository: IPermissionsRepository | null = null;
  private static roomsRepository: IRoomsRepository | null = null;

  static getLogsRepository(): ILogsRepository {
    if (!this.logsRepository) {
      this.logsRepository = new LogsRepository();
    }
    return this.logsRepository;
  }

  static getAuthRepository(): IAuthRepository {
    if (!this.authRepository) {
      this.authRepository = new AuthRepository();
    }
    return this.authRepository;
  }

  static getAppointmentsRepository(): IAppointmentsRepository {
    if (!this.appointmentsRepository) {
      this.appointmentsRepository = new AppointmentsRepository();
    }
    return this.appointmentsRepository;
  }

  static getCustomersRepository(): ICustomersRepository {
    if (!this.customersRepository) {
      this.customersRepository = new CustomersRepository();
    }
    return this.customersRepository;
  }

  static getRoomsRepository(): IRoomsRepository {
    if (!this.roomsRepository) {
      this.roomsRepository = new RoomsRepository();
    }
    return this.roomsRepository;
  }

  static getPermissionsRepository(): IPermissionsRepository {
    if (!this.permissionsRepository) {
      this.permissionsRepository = new PermissionsRepository();
    }
    return this.permissionsRepository;
  }
}

export { RepositoryFactory };
