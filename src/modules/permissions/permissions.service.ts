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

  private formatPermissionStatus(canView: boolean): string {
    return canView ? "permitido" : "bloqueado";
  }

  private buildPermissionChange(module: string, oldValue: boolean, newValue: boolean): string {
    const statusOld = this.formatPermissionStatus(oldValue);
    const statusNew = this.formatPermissionStatus(newValue);
    return `${module}: ${statusOld} -> ${statusNew}`;
  }

  private buildPermissionChangeLog(customerId: number, changes: string[]): string {
    return `Permissões alteradas para o cliente ${customerId}: ${changes.join("; ")}`;
  }

  private async logPermissionChanges(
    customerId: number,
    changes: string[],
    actorId: number
  ): Promise<void> {
    if (changes.length === 0) {
      return;
    }

    const description = this.buildPermissionChangeLog(customerId, changes);
    await this.activityLogs.createLog({
      userId: actorId,
      module: "ACCOUNT",
      activityType: "Atualização de permissões",
      description
    });
  }

  async updatePermissions(
    customerId: number,
    modules: ModulePermissionUpdate[],
    actorId: number
  ): Promise<PermissionResult[]> {
    const existingPermissions = await this.repository.findAllByCustomerId(customerId);
    const permissionsMap = new Map(
      existingPermissions.map((p) => [p.module, p.canView])
    );

    const transaction = await sequelize.transaction();
    const changes: string[] = [];

    try {
      for (const item of modules) {
        const oldValue = permissionsMap.get(item.module) ?? true;
        const newValue = item.canView;

        if (oldValue !== newValue) {
          changes.push(this.buildPermissionChange(item.module, oldValue, newValue));
        }

        await this.repository.upsert(customerId, item.module, item.canView, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await this.logPermissionChanges(customerId, changes, actorId);

    return this.getPermissionsByCustomerId(customerId);
  }
}

export { PermissionsService };
