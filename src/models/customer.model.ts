import { DataTypes, Model } from "sequelize";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes
} from "sequelize";
import { sequelize } from "../config/db.js";

export class Customer
  extends Model<
    InferAttributes<
      Customer,
      { omit: "createdAt" | "updatedAt" | "deletedAt" }
    >,
    InferCreationAttributes<
      Customer,
      { omit: "createdAt" | "updatedAt" | "deletedAt" }
    >
  >
{
  declare id: CreationOptional<number>;
  declare userId: number;
  declare zipCode: string;
  declare street: string;
  declare number: string;
  declare complement: CreationOptional<string | null>;
  declare neighborhood: string;
  declare city: string;
  declare state: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

Customer.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    street: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    complement: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    neighborhood: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: "customers",
    modelName: "Customer",
    timestamps: true,
    paranoid: true
  }
);
