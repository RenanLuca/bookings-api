import { DataTypes, Model } from "sequelize";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes
} from "sequelize";
import { sequelize } from "../config/db.js";

export type UserRole = "ADMIN" | "CUSTOMER";
export type UserStatus = "ACTIVE" | "INACTIVE";

export class User
  extends Model<
    InferAttributes<
      User,
      { omit: "createdAt" | "updatedAt" | "deletedAt" }
    >,
    InferCreationAttributes<
      User,
      { omit: "createdAt" | "updatedAt" | "deletedAt" }
    >
  >
{
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare role: CreationOptional<UserRole>;
  declare status: CreationOptional<UserStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

User.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM("ADMIN", "CUSTOMER"),
      allowNull: false,
      defaultValue: "CUSTOMER"
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      allowNull: false,
      defaultValue: "ACTIVE"
    }
  },
  {
    sequelize,
    tableName: "users",
    modelName: "User",
    timestamps: true,
    paranoid: true
  }
);
