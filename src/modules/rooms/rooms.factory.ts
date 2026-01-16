import { RepositoryFactory } from "../../shared/factories/repository.factory.js";
import { LogsFactory } from "../logs/logs.factory.js";
import { RoomsService } from "./rooms.service.js";

class RoomsFactory {
  private static roomsService: RoomsService | null = null;

  static createService(): RoomsService {
    if (!this.roomsService) {
      const repository = RepositoryFactory.getRoomsRepository();
      const logsService = LogsFactory.createService();
      this.roomsService = new RoomsService(repository, logsService);
    }
    return this.roomsService;
  }
}

export { RoomsFactory };
