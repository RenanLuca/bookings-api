import { DataTypes, Model } from "sequelize";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes
} from "sequelize";
import { sequelize } from "../config/db.js";

export class AuthToken
  extends Model<
    InferAttributes<
      AuthToken,
      { omit: "createdAt" | "updatedAt" | "deletedAt" }
    >,
    InferCreationAttributes<
      AuthToken,
      { omit: "createdAt" | "updatedAt" | "deletedAt" }
    >
  >
{
  declare id: CreationOptional<number>;
  declare userId: number;
  declare token: string;
  declare expiresAt: Date;
  declare revokedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

AuthToken.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "auth_tokens",
    modelName: "AuthToken",
    timestamps: true,
    paranoid: true
  }
);
