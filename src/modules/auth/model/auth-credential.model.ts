import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";
import type { AuthCredentialModel, AuthCredentialModelRow } from "./auth-credential-model.type.js";
export function createAuthCredentialModel(database: Sequelize): AuthCredentialModel {
  return database.define<AuthCredentialModelRow>(
    "AuthCredential",
    {
      userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      passwordHash: { type: DataTypes.TEXT, allowNull: true },
      deletedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "auth_credentials", timestamps: false, underscored: true },
  );
}
