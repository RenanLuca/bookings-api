import { RepositoryFactory } from "../../shared/factories/repository.factory.js";
import { LogsFactory } from "../logs/logs.factory.js";
import { PermissionsService } from "./permissions.service.js";

class PermissionsFactory {
  private static permissionsService: PermissionsService | null = null;

  static createService(): PermissionsService {
    if (!this.permissionsService) {
      const repository = RepositoryFactory.getPermissionsRepository();
      const logsService = LogsFactory.createService();
      this.permissionsService = new PermissionsService(repository, logsService);
    }
    return this.permissionsService;
  }
}

export { PermissionsFactory };
