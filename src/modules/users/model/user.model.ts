import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";
import type { UserModel, UserModelRow } from "./user-model.type.js";
export function createUserModel(database: Sequelize): UserModel {
  return database.define<UserModelRow>(
    "User",
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      role_id: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(254), allowNull: false },
      phone_number: { type: DataTypes.STRING(20), allowNull: true },
      country_code: { type: DataTypes.STRING(5), allowNull: true },
    },
    { tableName: "users", timestamps: true, underscored: true, paranoid: true },
  );
}
