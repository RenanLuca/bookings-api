import type { CreateOptions, FindOptions, SaveOptions, Transaction } from "sequelize";
import { CustomerModulePermission } from "../../models/index.js";
import { PERMISSION_MODULES, type PermissionModule } from "../../shared/permissions/modules.js";
import type { IPermissionsRepository } from "./permissions.repository.interface.js";

type PermissionAttributes = CustomerModulePermission["_attributes"];

class PermissionsRepository implements IPermissionsRepository {
  async findByCustomerAndModule(
    customerId: number,
    module: PermissionModule
  ): Promise<CustomerModulePermission | null> {
    return CustomerModulePermission.findOne({
      where: { customerId, module }
    });
  }

  async findAllByCustomerId(customerId: number): Promise<CustomerModulePermission[]> {
    return CustomerModulePermission.findAll({
      where: { customerId }
    });
  }

  async upsert(
    customerId: number,
    module: PermissionModule,
    canView: boolean,
    transaction?: Transaction
  ): Promise<CustomerModulePermission> {
    const findOptions: FindOptions<PermissionAttributes> = {
      where: { customerId, module }
    };
    if (transaction) {
      findOptions.transaction = transaction;
    }

    const existing = await CustomerModulePermission.findOne(findOptions);

    if (existing) {
      existing.canView = canView;
      const saveOptions: SaveOptions<PermissionAttributes> = {};
      if (transaction) {
        saveOptions.transaction = transaction;
      }
      await existing.save(saveOptions);
      return existing;
    }

    const createOptions: CreateOptions<PermissionAttributes> = {};
    if (transaction) {
      createOptions.transaction = transaction;
    }

    return CustomerModulePermission.create(
      { customerId, module, canView },
      createOptions
    );
  }

  async createDefaultPermissions(
    customerId: number,
    transaction?: Transaction
  ): Promise<CustomerModulePermission[]> {
    const permissions: CustomerModulePermission[] = [];
    const createOptions: CreateOptions<PermissionAttributes> = {};
    if (transaction) {
      createOptions.transaction = transaction;
    }

    for (const module of PERMISSION_MODULES) {
      const permission = await CustomerModulePermission.create(
        { customerId, module, canView: true },
        createOptions
      );
      permissions.push(permission);
    }

    return permissions;
  }
}

export { PermissionsRepository };
