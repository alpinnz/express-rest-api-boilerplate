import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";
import type { AuthSessionModel, AuthSessionModelRow } from "./auth-session-model.type.js";

export function createAuthSessionModel(database: Sequelize): AuthSessionModel {
  return database.define<AuthSessionModelRow>(
    "AuthSession",
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      accessTokenHash: { type: DataTypes.STRING(64), allowNull: false },
      refreshTokenHash: { type: DataTypes.STRING(64), allowNull: false },
      accessExpiresAt: { type: DataTypes.DATE, allowNull: false },
      refreshExpiresAt: { type: DataTypes.DATE, allowNull: false },
      rememberMe: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      revokedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "auth_sessions", timestamps: false, underscored: true },
  );
}
