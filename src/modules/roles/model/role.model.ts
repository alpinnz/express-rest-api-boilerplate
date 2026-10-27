import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";
import type { RoleModel, RoleModelRow } from "./role-model.type.js";

export function createRoleModel(database: Sequelize): RoleModel {
  return database.define<RoleModelRow>(
    "Role",
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      name: { type: DataTypes.STRING(50), allowNull: false, unique: "roles_name_key" },
      level: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: "roles", timestamps: true, underscored: true, paranoid: true },
  );
}
