import { RepositoryFactory } from "../../shared/factories/repository.factory.js";
import { LogsFactory } from "../logs/logs.factory.js";
import { PermissionsFactory } from "../permissions/permissions.factory.js";
import { CustomersService } from "./customers.service.js";

class CustomersFactory {
  private static customersService: CustomersService | null = null;

  static createService(): CustomersService {
    if (!this.customersService) {
      const repository = RepositoryFactory.getCustomersRepository();
      const logsService = LogsFactory.createService();
      const permissionsService = PermissionsFactory.createService();
      this.customersService = new CustomersService(
        repository,
        logsService,
        permissionsService
      );
    }
    return this.customersService;
  }
}

export { CustomersFactory };
