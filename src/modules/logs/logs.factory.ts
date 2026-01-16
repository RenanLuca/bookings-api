import { RepositoryFactory } from "../../shared/factories/repository.factory.js";
import { LogsService } from "./logs.service.js";
import type { ILogsService } from "./logs.service.interface.js";

class LogsFactory {
  private static logsService: LogsService | null = null;

  static createService(): ILogsService {
    if (!this.logsService) {
      const repository = RepositoryFactory.getLogsRepository();
      this.logsService = new LogsService(repository);
    }
    return this.logsService;
  }
}

export { LogsFactory };
