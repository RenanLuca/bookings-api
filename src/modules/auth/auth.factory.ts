import { RepositoryFactory } from "../../shared/factories/repository.factory.js";
import { LogsFactory } from "../logs/logs.factory.js";
import { AuthService } from "./auth.service.js";

class AuthFactory {
  private static authService: AuthService | null = null;

  static createService(): AuthService {
    if (!this.authService) {
      const repository = RepositoryFactory.getAuthRepository();
      const logsService = LogsFactory.createService();
      this.authService = new AuthService(repository, logsService);
    }
    return this.authService;
  }
}

export { AuthFactory };