import { DataTypes, Model } from "sequelize";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes
} from "sequelize";
import { sequelize } from "../config/db.js";

export type AppointmentStatus = "PENDING" | "SCHEDULED" | "CANCELED";

export class Appointment
  extends Model<
    InferAttributes<
      Appointment,
      { omit: "createdAt" | "updatedAt" | "deletedAt" }
    >,
    InferCreationAttributes<
      Appointment,
      { omit: "createdAt" | "updatedAt" | "deletedAt" }
    >
  >
{
  declare id: CreationOptional<number>;
  declare customerId: number;
  declare roomId: number;
  declare scheduledAt: Date;
  declare status: CreationOptional<AppointmentStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

Appointment.init(
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
    roomId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
  scheduledAt: {
    type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("PENDING", "SCHEDULED", "CANCELED"),
      allowNull: false,
      defaultValue: "PENDING"
    }
  },
  {
    sequelize,
    tableName: "appointments",
    modelName: "Appointment",
    timestamps: true,
    paranoid: true
  }
);
