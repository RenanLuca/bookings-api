import { DataTypes, Model } from "sequelize";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes
} from "sequelize";
import { sequelize } from "../config/db.js";
import type { PermissionModule } from "../shared/permissions/modules.js";

export class CustomerModulePermission extends Model<
  InferAttributes<
    CustomerModulePermission,
    { omit: "createdAt" | "updatedAt" | "deletedAt" }
  >,
  InferCreationAttributes<
    CustomerModulePermission,
    { omit: "createdAt" | "updatedAt" | "deletedAt" }
  >
> {
  declare id: CreationOptional<number>;
  declare customerId: number;
  declare module: PermissionModule;
  declare canView: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

CustomerModulePermission.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    customerId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    canView: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: "customer_module_permissions",
    modelName: "CustomerModulePermission",
    timestamps: true,
    paranoid: true
  }
);
