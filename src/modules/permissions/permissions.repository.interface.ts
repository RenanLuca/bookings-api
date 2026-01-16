import type { Transaction } from "sequelize";
import type { PermissionModule } from "../../shared/permissions/modules.js";
import type { CustomerModulePermission } from "../../models/customer-module-permission.model.js";

interface IPermissionsRepository {
  findByCustomerAndModule(
    customerId: number,
    module: PermissionModule
  ): Promise<CustomerModulePermission | null>;

  findAllByCustomerId(customerId: number): Promise<CustomerModulePermission[]>;

  upsert(
    customerId: number,
    module: PermissionModule,
    canView: boolean,
    transaction?: Transaction
  ): Promise<CustomerModulePermission>;

  createDefaultPermissions(
    customerId: number,
    transaction?: Transaction
  ): Promise<CustomerModulePermission[]>;
}

export type { IPermissionsRepository };
