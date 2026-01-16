import { RepositoryFactory } from "../../shared/factories/repository.factory.js";
import { LogsFactory } from "../logs/logs.factory.js";
import { PermissionsFactory } from "../permissions/permissions.factory.js";
import { AppointmentsService } from "./appointments.service.js";

class AppointmentsFactory {
  private static appointmentsService: AppointmentsService | null = null;

  static createService(): AppointmentsService {
    if (!this.appointmentsService) {
      const repository = RepositoryFactory.getAppointmentsRepository();
      const logsService = LogsFactory.createService();
      const permissionsService = PermissionsFactory.createService();
      this.appointmentsService = new AppointmentsService(
        repository,
        logsService,
        permissionsService
      );
    }
    return this.appointmentsService;
  }
}

export { AppointmentsFactory };
