import { DataTypes, Model } from "sequelize";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes
} from "sequelize";
import { sequelize } from "../config/db.js";

export type ActivityLogModule = "ACCOUNT" | "APPOINTMENT";

export class ActivityLog
  extends Model<
    InferAttributes<
      ActivityLog,
      { omit: "createdAt" | "updatedAt" | "deletedAt" }
    >,
    InferCreationAttributes<
      ActivityLog,
      { omit: "createdAt" | "updatedAt" | "deletedAt" }
    >
  >
{
  declare id: CreationOptional<number>;
  declare userId: CreationOptional<number | null>;
  declare module: ActivityLogModule;
  declare activityType: string;
  declare description: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

ActivityLog.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    module: {
      type: DataTypes.ENUM("ACCOUNT", "APPOINTMENT"),
      allowNull: false
    },
    activityType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "General"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: "activity_logs",
    modelName: "ActivityLog",
    timestamps: true,
    paranoid: true
  }
);
