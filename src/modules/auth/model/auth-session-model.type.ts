import type { Model, ModelStatic } from "sequelize";

export interface AuthSessionModelRow extends Model {
  id: string;
  userId: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
  rememberMe: boolean;
  revokedAt: Date | null;
}

export type AuthSessionModel = ModelStatic<AuthSessionModelRow>;
