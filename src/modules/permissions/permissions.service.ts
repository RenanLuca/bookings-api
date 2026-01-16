import { sequelize } from "../../config/db.js";
import { PERMISSION_MODULES, type PermissionModule } from "../../shared/permissions/modules.js";
import { ModuleAccessForbiddenError } from "./errors/index.js";
import type { ILogsService } from "../logs/logs.service.interface.js";
import type { IPermissionsRepository } from "./permissions.repository.interface.js";
import type {
  IPermissionsService,
  ModulePermissionUpdate,
  PermissionResult
} from "./permissions.service.interface.js";
import type { Transaction } from "sequelize";

class PermissionsService implements IPermissionsService {
  constructor(
    private readonly repository: IPermissionsRepository,
    private readonly activityLogs: ILogsService
  ) {}

  async assertCanViewModule(customerId: number, module: PermissionModule): Promise<void> {
    const permission = await this.repository.findByCustomerAndModule(customerId, module);

    if (!permission) {
      return;
    }

    if (!permission.canView) {
      throw new ModuleAccessForbiddenError();
    }
  }

  async createDefaultPermissions(customerId: number, transaction?: Transaction): Promise<void> {
    await this.repository.createDefaultPermissions(customerId, transaction);
  }

  async getPermissionsByCustomerId(customerId: number): Promise<PermissionResult[]> {
    const permissions = await this.repository.findAllByCustomerId(customerId);

    const result: PermissionResult[] = PERMISSION_MODULES.map((mod) => {
      const found = permissions.find((p) => p.module === mod);
      return {
        module: mod,
        canView: found ? found.canView : true
      };
    });

    return result;
  }

  async updatePermissions(
    customerId: number,
    modules: ModulePermissionUpdate[],
    actorId: number
  ): Promise<PermissionResult[]> {
    const transaction = await sequelize.transaction();
    const changes: string[] = [];

    try {
      for (const item of modules) {
        const existing = await this.repository.findByCustomerAndModule(
          customerId,
          item.module
        );

        const oldValue = existing ? existing.canView : true;
        const newValue = item.canView;

        if (oldValue !== newValue) {
          const statusOld = oldValue ? "permitido" : "bloqueado";
          const statusNew = newValue ? "permitido" : "bloqueado";
          changes.push(`${item.module}: ${statusOld} -> ${statusNew}`);
        }

        await this.repository.upsert(customerId, item.module, item.canView, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    if (changes.length > 0) {
      const description = `Permissões alteradas para o cliente ${customerId}: ${changes.join("; ")}`;
      await this.activityLogs.createLog({
        userId: actorId,
        module: "ACCOUNT",
        activityType: "Atualização de permissões",
        description
      });
    }

    return this.getPermissionsByCustomerId(customerId);
  }
}

export { PermissionsService };
