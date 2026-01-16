import type { Transaction } from "sequelize";
import type { PermissionModule } from "../../shared/permissions/modules.js";

interface ModulePermissionUpdate {
  module: PermissionModule;
  canView: boolean;
}

interface PermissionResult {
  module: PermissionModule;
  canView: boolean;
}

interface IPermissionsService {
  assertCanViewModule(customerId: number, module: PermissionModule): Promise<void>;
  createDefaultPermissions(customerId: number, transaction?: Transaction): Promise<void>;
  updatePermissions(
    customerId: number,
    modules: ModulePermissionUpdate[],
    actorId: number
  ): Promise<PermissionResult[]>;
  getPermissionsByCustomerId(customerId: number): Promise<PermissionResult[]>;
}

export type { IPermissionsService, ModulePermissionUpdate, PermissionResult };
